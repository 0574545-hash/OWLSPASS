import { useCallback, useRef, useSyncExternalStore } from 'react'
import type {
  CashOp,
  CatalogItem,
  Client,
  Minutes,
  NotificationRule,
  Order,
  OrderItem,
  PaymentMethod,
  PaymentSettings,
  Refund,
  RefundLine,
  Requisites,
  Shift,
  User,
} from '../domain/types'
import {
  CATALOG,
  COLLECTION_AMOUNT,
  CURRENT_SHIFT_NO,
  DISCOUNT_GROUNDS,
  NOTIFICATIONS,
  PAYMENT_SETTINGS,
  REQUISITES,
  ROLES,

  FIRST_ORDER_NO,
  buildEmpty,
  buildSeed,
  tariffDuration,
} from '../domain/seed'
import { NOW, SHIFT_DATE, now, orderTotals, setNowSource, wallClock } from '../domain/rules'
import { shortName } from '../lib/format'

export interface CurrentShift {
  no: number
  date: string
  openedAt: Minutes
  closedAt?: Minutes
  admin: string
  cashier: string
  opening: number
  openComment: string
  /** Set when the shift is closed: the counted cash and why it differs. */
  counted?: number
  discrepancyReason?: string
  closeComment?: string
}

export interface Session {
  userId: string | null
  /** Locked keeps the shift running but sends the workstation back to the PIN. */
  locked: boolean
}

export type DataMode = 'demo' | 'clean'

export interface AppState {
  /** «demo» — смена из макета, «clean» — пустая касса для ручной проверки. */
  mode: DataMode
  session: Session
  shiftStarted: boolean
  shift: CurrentShift
  clients: Client[]
  orders: Order[]
  houseOps: CashOp[]
  users: User[]
  shifts: Shift[]
  catalog: CatalogItem[]
  discountGrounds: typeof DISCOUNT_GROUNDS
  roles: typeof ROLES
  notifications: NotificationRule[]
  requisites: Requisites
  paymentSettings: PaymentSettings
  /** Set by «Закрыть смену», read by the report window. */
  lastReport: ShiftReport | null
}

export interface ShiftReport {
  no: number
  date: string
  openedAt: Minutes
  closedAt: Minutes
  admin: string
  cashier: string
  ops: number
  cash: number
  cashless: number
  refunds: number
  collected: number
  discrepancy: number
  revenue: number
  comment: string
}

function initialState(mode: DataMode = 'demo'): AppState {
  const seed = mode === 'clean' ? buildEmpty() : buildSeed()
  const previous = seed.shifts[0]
  return {
    mode,
    session: { userId: null, locked: false },
    shiftStarted: false,
    shift: {
      no: CURRENT_SHIFT_NO,
      date: SHIFT_DATE,
      openedAt: 9 * 60,
      admin: 'Смирнова Е. В.',
      cashier: 'Бекетов И. С.',
      // The drawer opens holding whatever the previous shift left in it.
      opening: previous?.closingCash ?? 0,
      openComment: mode === 'clean' ? '' : 'Купюрами по 100 и 500 для сдачи, принял кассир.',
    },
    clients: seed.clients,
    orders: seed.orders,
    houseOps: seed.cashOps,
    users: seed.users,
    shifts: seed.shifts,
    // Тарифы заказчик заводит сам — в пустой сборке их нет.
    catalog: mode === 'clean' ? CATALOG.filter((c) => c.category !== 'Тариф') : CATALOG,
    discountGrounds: DISCOUNT_GROUNDS,
    roles: ROLES,
    notifications: NOTIFICATIONS,
    requisites: REQUISITES,
    paymentSettings: PAYMENT_SETTINGS,
    lastReport: null,
  }
}

/* ------------------------------------------------------------
   Persistence. A workstation at the desk gets refreshed by accident;
   losing the open shift over it would be unacceptable, so the whole
   state rides in sessionStorage and deep links survive a reload.
   Bump STORAGE_VERSION whenever the shape changes.
   ------------------------------------------------------------ */
const STORAGE_VERSION = 1

/** Which dataset a fresh session starts on. The standalone «пустая касса»
 *  build sets this before the app script runs; everything else opens on the
 *  demo shift. */
function startMode(): DataMode {
  const flag = (globalThis as { __AQUA_MODE__?: string }).__AQUA_MODE__
  return flag === 'clean' ? 'clean' : 'demo'
}

/** Keyed by mode so the demo and the empty till never restore each other's
 *  state — both builds can share one file:// origin. */
const STORAGE_KEY = `aqua-party-crm:${startMode()}`

function load(): AppState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState(startMode())
    const parsed = JSON.parse(raw) as { version: number; state: AppState }
    if (parsed.version !== STORAGE_VERSION) return initialState(startMode())
    return parsed.state
  } catch {
    // Private mode, blocked storage, corrupt payload — start fresh.
    return initialState(startMode())
  }
}

function save(s: AppState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, state: s }))
  } catch {
    // Persistence is a convenience; never let it break the till.
  }
}

let state: AppState = load()

// Пустая касса живёт по настоящим часам: смена открывается и закрывается по
// факту. Демо-смена стоит на 15:00 — иначе её данные разъедутся.
setNowSource(() => (state.mode === 'clean' ? wallClock() : NOW))
const listeners = new Set<() => void>()

function set(next: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const patch = typeof next === 'function' ? next(state) : next
  state = { ...state, ...patch }
  save(state)
  listeners.forEach((l) => l())
}

export function getState(): AppState {
  return state
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** `useSyncExternalStore` demands a snapshot that keeps its identity while
 *  nothing has changed; a selector that builds a fresh array would spin the
 *  renderer forever. Comparing one level deep gives back the previous value
 *  whenever the selector rebuilt an equivalent one. */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) =>
    Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  )
}

export function useStore<T>(selector: (s: AppState) => T): T {
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const cache = useRef<{ value: T } | null>(null)

  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(state)
    if (cache.current !== null && shallowEqual(cache.current.value, next)) {
      return cache.current.value
    }
    cache.current = { value: next }
    return next
  }, [])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Derived views are computed once per state version, so every consumer sees
 *  the same array or object and snapshots stay stable. */
const derived = new WeakMap<AppState, Map<string, unknown>>()

function derive<T>(s: AppState, key: string, compute: () => T): T {
  let bucket = derived.get(s)
  if (!bucket) {
    bucket = new Map()
    derived.set(s, bucket)
  }
  if (!bucket.has(key)) bucket.set(key, compute())
  return bucket.get(key) as T
}

/* ============================================================
   Derived views
   ============================================================ */

export function clientOf(s: AppState, clientId: string): Client | undefined {
  return s.clients.find((c) => c.id === clientId)
}

/** Длительность тарифа берётся из справочника в состоянии: его правят, и
 *  правка должна сразу отражаться в заказах. */
export function tariffDurationOf(s: AppState, itemId: string): number {
  return tariffDuration(itemId, s.catalog)
}

export function totalsOf(s: AppState, order: Order) {
  return orderTotals(order, clientOf(s, order.clientId), tariffDurationOf(s, order.tariffItemId))
}

/** The cash journal: house operations plus everything the orders generated. */
export function cashJournal(s: AppState): CashOp[] {
  return derive(s, 'cashJournal', () => buildCashJournal(s))
}

function buildCashJournal(s: AppState): CashOp[] {
  const ops: CashOp[] = [...s.houseOps]

  for (const order of s.orders) {
    const client = clientOf(s, order.clientId)
    const name = client?.fullName ?? '—'

    for (const p of order.payments) {
      ops.push({
        id: `op-${order.no}-${p.id}`,
        at: p.at,
        orderNo: order.no,
        subject: name,
        kind:
          p.title === 'Частичная оплата'
            ? 'Частичная оплата'
            : p.title.startsWith('Предоплата')
              ? 'Предоплата 50 %'
              : p.title === 'Продажа товара'
                ? 'Продажа товара'
                : 'Оплата заказа',
        method: p.method,
        amount: p.amount,
        cashier: p.cashier,
      })
    }

    for (const r of order.refunds) {
      ops.push({
        id: `op-${order.no}-${r.id}`,
        at: r.at,
        orderNo: order.no,
        subject: name,
        kind: 'Возврат',
        method: r.method,
        amount: -r.amount,
        cashier: shortName(r.by.split(',')[0]!.trim()),
      })
    }

    // An order with nothing paid still belongs in the journal — that is where
    // the administrator picks it up with «Оплатить».
    if (order.payments.length === 0 && order.status === 'open') {
      const totals = totalsOf(s, order)
      ops.push({
        id: `op-${order.no}-unpaid`,
        at: order.createdAt + 60,
        orderNo: order.no,
        subject: name,
        kind: 'Не оплачено',
        method: 'Не оплачено',
        amount: totals.remainder,
        cashier: s.shift.cashier,
      })
    }
  }

  return ops.sort((a, b) => b.at - a.at)
}

export interface CashSummary {
  cashOnHand: number
  cashless: number
  refunds: number
  collected: number
  deposits: number
  ops: number
  payments: number
  revenue: number
  avgCheck: number
}

export function cashSummary(s: AppState): CashSummary {
  return derive(s, 'cashSummary', () => buildCashSummary(s))
}

function buildCashSummary(s: AppState): CashSummary {
  const ops = cashJournal(s)
  // The drawer opens on what yesterday left in it. That is a balance, not a
  // movement, so it is not an operation in the journal.
  let cashOnHand = s.shift.opening
  let cashless = 0
  let refunds = 0
  let collected = 0
  let deposits = 0
  let payments = 0
  let taken = 0

  for (const op of ops) {
    if (op.kind === 'Не оплачено') continue
    if (op.method === 'Наличные') cashOnHand += op.amount
    else if (op.method !== 'Не оплачено') cashless += op.amount

    if (op.kind === 'Возврат') refunds += -op.amount
    else if (op.kind === 'Выемка') collected += -op.amount
    else if (op.kind === 'Внесение') deposits += op.amount
    else {
      payments += 1
      taken += op.amount
    }
  }

  // Выручка is what the centre actually earned: money taken from clients less
  // what was handed back. The float and the collection move cash around
  // without earning anything, so neither belongs here.
  const revenue = taken - refunds
  return {
    cashOnHand,
    cashless,
    refunds,
    collected,
    deposits,
    ops: ops.filter((o) => o.kind !== 'Не оплачено').length,
    payments,
    revenue,
    avgCheck: payments === 0 ? 0 : Math.round(revenue / payments),
  }
}

/** Positive = prepaid, negative = owed. */
export function clientBalance(s: AppState, clientId: string): number {
  const client = clientOf(s, clientId)
  if (!client) return 0
  const owed = s.orders
    .filter((o) => o.clientId === clientId && o.status === 'open')
    .reduce((sum, o) => sum + totalsOf(s, o).remainder, 0)
  return client.seededBalance - owed
}

export function debtSummary(s: AppState): { total: number; clients: number } {
  return derive(s, 'debtSummary', () => {
    let total = 0
    let clients = 0
    for (const c of s.clients) {
      const balance = clientBalance(s, c.id)
      if (balance < 0) {
        total += -balance
        clients += 1
      }
    }
    return { total, clients }
  })
}

export function openOrders(s: AppState): Order[] {
  return derive(s, 'openOrders', () => s.orders.filter((o) => o.status === 'open'))
}

export function unpaidOrders(s: AppState): Order[] {
  return derive(s, 'unpaidOrders', () => s.orders.filter((o) => totalsOf(s, o).remainder > 0))
}

/** The next order number. On a clean till there is nothing to count from,
 *  so numbering starts at the first of the shift. */
export function nextOrderNo(s: AppState): number {
  if (s.orders.length === 0) return FIRST_ORDER_NO
  return Math.max(...s.orders.map((o) => o.no)) + 1
}

export function currentUser(s: AppState): User | undefined {
  return s.users.find((u) => u.id === s.session.userId)
}

/* ============================================================
   Actions
   ============================================================ */

let seq = 0
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq += 1)}`

export const actions = {
  /** PIN identifies the employee; a disabled one cannot get in. */
  login(pin: string): { ok: boolean; error?: string } {
    const user = state.users.find((u) => u.pin === pin)
    if (!user) return { ok: false, error: 'Неверный PIN' }
    if (user.status === 'disabled') return { ok: false, error: 'Доступ сотрудника отключён' }
    set({ session: { userId: user.id, locked: false } })
    return { ok: true }
  },

  lock(): void {
    set({ session: { ...state.session, locked: true } })
  },

  logout(): void {
    set({ session: { userId: null, locked: false } })
  },

  openShift(input: {
    opening: number
    admin: string
    cashier: string
    comment: string
    /** Момент открытия — фактический, а не плановый. */
    openedAt: Minutes
  }): void {
    set({
      shiftStarted: true,
      shift: {
        ...state.shift,
        openedAt: input.openedAt,
        opening: input.opening,
        admin: input.admin,
        cashier: input.cashier,
        openComment: input.comment,
      },
    })
  },

  /** Used when signing in to a shift that is already running. */
  resumeShift(): void {
    set({ shiftStarted: true })
  },

  createOrder(input: {
    clientId: string
    childIds: string[]
    items: OrderItem[]
    comment: string
    manualDiscount: number
    tariffItemId: string
    tariffLabel: string
  }): Order {
    const no = nextOrderNo(state)
    const order: Order = {
      id: nextId('o'),
      no,
      createdAt: now(),
      clientId: input.clientId,
      childIds: input.childIds,
      tariffItemId: input.tariffItemId,
      tariffLabel: input.tariffLabel,
      items: input.items,
      comment: input.comment,
      manualDiscount: input.manualDiscount,
      payments: [],
      status: 'open',
      refunds: [],
    }
    set({ orders: [order, ...state.orders] })
    return order
  },

  updateOrder(orderId: string, patch: Partial<Order>): void {
    set({ orders: state.orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o)) })
  },

  /** Settling an order fixes the actual end of the visit, which is what
   *  turns elapsed time into an over-time charge. */
  payOrder(orderId: string, input: { amount: number; method: PaymentMethod; comment: string }): void {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order) return
    const endedAt = order.endedAt ?? now()
    const withEnd: Order = { ...order, endedAt }
    const totals = totalsOf({ ...state, orders: [withEnd] }, withEnd)
    const payment = {
      id: nextId('p'),
      at: now(),
      amount: Math.min(input.amount, totals.remainder),
      method: input.method,
      title: order.payments.length > 0 ? 'Доплата' : 'Оплата заказа',
      cashier: currentUser(state) ? shortName(currentUser(state)!.fullName) : state.shift.cashier,
    }
    const payments = [...order.payments, payment]
    const settled = totals.remainder - payment.amount <= 0
    set({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              endedAt,
              payments,
              comment: input.comment,
              status: settled ? 'closed' : o.status,
              closedAt: settled ? now() : o.closedAt,
            }
          : o,
      ),
    })
  },

  /** «Закрыть заказ» — only legal with nothing outstanding. */
  closeOrder(orderId: string): void {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order || totalsOf(state, order).remainder > 0) return
    set({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'closed', closedAt: o.closedAt ?? now() } : o,
      ),
    })
  },

  refundOrder(
    orderId: string,
    input: { lines: RefundLine[]; amount: number; reason: string; method: PaymentMethod },
  ): void {
    const order = state.orders.find((o) => o.id === orderId)
    if (!order) return
    const user = currentUser(state)
    const refund: Refund = {
      id: nextId('r'),
      at: now(),
      lines: input.lines,
      amount: input.amount,
      reason: input.reason,
      method: input.method,
      by: user ? `${shortName(user.fullName)}, ${user.role.toLowerCase()}` : state.shift.admin,
    }
    set({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, refunds: [...o.refunds, refund] } : o,
      ),
    })
  },

  deposit(input: { amount: number; ground: string; from: string; to: string; comment: string }): void {
    const op: CashOp = {
      id: nextId('op'),
      at: now(),
      subject: input.ground,
      kind: 'Внесение',
      method: 'Наличные',
      amount: input.amount,
      cashier: shortName(input.to.split(',')[0]!.trim()),
    }
    set({ houseOps: [...state.houseOps, op] })
  },

  collect(input: { amount: number; ground: string; from: string; to: string; comment: string }): void {
    const op: CashOp = {
      id: nextId('op'),
      at: now(),
      subject: 'Инкассация',
      kind: 'Выемка',
      method: 'Наличные',
      amount: -input.amount,
      cashier: shortName(input.to.split(',')[0]!.trim()),
    }
    set({ houseOps: [...state.houseOps, op] })
  },

  closeShift(input: { counted: number; reason: string; comment: string }): ShiftReport {
    const summary = cashSummary(state)
    const discrepancy = input.counted - summary.cashOnHand
    const report: ShiftReport = {
      no: state.shift.no,
      date: state.shift.date,
      openedAt: state.shift.openedAt,
      closedAt: now(),
      admin: state.shift.admin,
      cashier: state.shift.cashier,
      ops: summary.ops,
      cash: summary.cashOnHand,
      cashless: summary.cashless,
      refunds: summary.refunds,
      collected: summary.collected,
      discrepancy,
      revenue: summary.revenue,
      comment: input.comment,
    }
    const closed: Shift = {
      no: state.shift.no,
      date: state.shift.date,
      openedAt: state.shift.openedAt,
      closedAt: now(),
      admin: state.shift.admin,
      cashier: state.shift.cashier,
      opening: state.shift.opening,
      ops: summary.ops,
      cash: summary.cashOnHand,
      cashless: summary.cashless,
      // What was actually counted. Whether it opens the next shift or goes to
      // the safe is decided then, by the policy in force.
      closingCash: input.counted,
      discrepancy,
      status: discrepancy === 0 ? 'closed' : 'discrepancy',
      comment: input.comment,
    }
    set({
      shift: {
        ...state.shift,
        closedAt: now(),
        counted: input.counted,
        discrepancyReason: input.reason,
        closeComment: input.comment,
      },
      shifts: [closed, ...state.shifts],
      lastReport: report,
    })
    return report
  },

  finishShiftReport(): void {
    set({ lastReport: null, shiftStarted: false, session: { userId: null, locked: false } })
  },

  saveClient(client: Client): void {
    const exists = state.clients.some((c) => c.id === client.id)
    set({
      clients: exists
        ? state.clients.map((c) => (c.id === client.id ? client : c))
        : [client, ...state.clients],
    })
  },

  newClientDraft(): Client {
    return {
      id: nextId('cl'),
      fullName: '',
      phone: '',
      birthDate: '',
      discountPct: 0,
      discountGround: '',
      discountUntil: '',
      comment: '',
      children: [],
      since: SHIFT_DATE,
      visits: 0,
      lastVisit: SHIFT_DATE,
      seededBalance: 0,
      ordersTotal: 0,
    }
  },

  saveCatalogItem(item: CatalogItem): void {
    const exists = state.catalog.some((c) => c.id === item.id)
    set({
      catalog: exists
        ? state.catalog.map((c) => (c.id === item.id ? item : c))
        : [...state.catalog, item],
    })
  },

  newCatalogDraft(category: CatalogItem['category']): CatalogItem {
    return {
      id: nextId('cat'),
      name: '',
      category,
      // Тариф меряется временем: «мин» + длительность + цена за эту длительность.
      unit:
        category === 'Товар' ? 'шт.' : category === 'Скидка' ? '%' : category === 'Тариф' ? 'мин' : 'чел.',
      price: 0,
      status: 'active',
      usedInOrders: 0,
      changedAt: SHIFT_DATE,
    }
  },

  deleteCatalogItem(id: string): void {
    set({ catalog: state.catalog.filter((c) => c.id !== id) })
  },

  saveUser(user: User): void {
    const exists = state.users.some((u) => u.id === user.id)
    set({
      users: exists ? state.users.map((u) => (u.id === user.id ? user : u)) : [...state.users, user],
    })
  },

  newUserDraft(): User {
    return {
      id: nextId('u'),
      fullName: '',
      role: 'Кассир',
      phone: '',
      schedule: '09:00—21:00',
      accessSummary: '',
      presence: 'off',
      pin: '',
      status: 'working',
      shiftsThisMonth: 0,
      discrepancies: 0,
      access: {
        ordersPayment: false,
        cashPayment: false,
        clientsEdit: false,
        catalogEdit: false,
        settings: false,
      },
    }
  },

  toggleNotification(id: string): void {
    set({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, enabled: !n.enabled } : n,
      ),
    })
  },

  saveRequisites(r: Requisites): void {
    set({ requisites: r })
  },

  savePaymentSettings(p: PaymentSettings): void {
    set({ paymentSettings: p })
  },

  /** Back to the seeded shift — handy for demos and for the walkthrough. */
  /** Wipes everything and rebuilds either the demo shift or an empty till. */
  resetTo(mode: DataMode): void {
    state = initialState(mode)
    save(state)
    listeners.forEach((l) => l())
  },
}

export { COLLECTION_AMOUNT, tariffDuration }
