import type { Client, Minutes, Order } from './types'

/** Историческая позиция каталога «Доплата за час сверх тарифа». Ставку
 *  теперь задаёт сам тариф — полем «Экстра время, цена за мин». */
export const OVERTIME_ITEM_ID = 'tariff-overtime'
export const OVERTIME_RATE = 350

/** Условия тарифа, от которых зависит доплата за превышение времени.
 *  Число вместо объекта — это только длительность: так продолжают
 *  работать все места, которым цена экстра-времени не нужна. */
export interface TariffTerms {
  durationMin: number
  /** Цена минуты сверх тарифа. Не задана — берётся ставка за начатый час. */
  extraPerMin?: number
}

export function tariffTerms(t: number | TariffTerms): TariffTerms {
  return typeof t === 'number' ? { durationMin: t } : t
}

/** Доплата за `over` минут сверх тарифа: минуты на цену экстра-времени.
 *  Цена не указана или 0 — превышение не считается. */
function extraCharge(over: Minutes, terms: TariffTerms): number {
  if (over <= 0 || !terms.extraPerMin) return 0
  return Math.round(over * terms.extraPerMin)
}

/** The moment the canvas is drawn at: every «Прошло» value in the demo
 *  shift resolves against 15:00 on 30.08.2026. */
export const NOW: Minutes = 15 * 60
export const SHIFT_DATE = '30.08.2026'

/** Часы приложения. В демо-смене они стоят на 15:00, иначе её данные
 *  разъедутся; на пустой кассе идут настоящие — смена открывается и
 *  закрывается по факту. Источник задаётся при старте (state/store). */
let nowSource: () => Minutes = () => NOW

export function setNowSource(fn: () => Minutes): void {
  nowSource = fn
}

export function now(): Minutes {
  return nowSource()
}

/** Настоящее время суток в минутах. */
export function wallClock(): Minutes {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Тариф без длительности — безлимитный: окончания нет, доплате не с чего
 *  считаться. Ноль как длительность и означает «безлимит». */
export const UNLIMITED = 0

/** Gross value of the lines, before any discount. */
export function itemsTotal(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

/** The percent discount is rounded half-up on the whole order — this is
 *  what makes 12 950 at 5 % come out as −648 and 1 130 at 5 % as −57. */
export function discountAmount(order: Order, client: Client | undefined): number {
  if (!client || client.discountPct === 0) return 0
  return Math.round((itemsTotal(order) * client.discountPct) / 100)
}

/** Planned end of the visit: creation plus the tariff's duration. */
export function plannedEnd(order: Order, tariffDurationMin: number): Minutes {
  return order.createdAt + tariffDurationMin
}

export function isUnlimited(tariffDurationMin: number): boolean {
  return tariffDurationMin === UNLIMITED
}

/** The moment the visit actually finished, if it has: the closing time for
 *  a settled order, otherwise the recorded exit. */
export function actualEnd(order: Order): Minutes | undefined {
  return order.closedAt ?? order.endedAt
}

/** «Окончание» as shown in the orders table — the actual end once the visit
 *  is over, the planned end while the child is still in the hall. */
export function endTime(order: Order, tariffDurationMin: number): Minutes | undefined {
  const actual = actualEnd(order)
  if (actual !== undefined) return actual
  return isUnlimited(tariffDurationMin) ? undefined : plannedEnd(order, tariffDurationMin)
}

/** «Прошло». While the visit runs the clock stops at the planned end — the
 *  order simply has not been settled yet. */
export function elapsed(order: Order, tariffDurationMin: number, at: Minutes = now()): Minutes {
  const end =
    actualEnd(order) ??
    (isUnlimited(tariffDurationMin) ? at : Math.min(at, plannedEnd(order, tariffDurationMin)))
  return Math.max(0, end - order.createdAt)
}

/** Over-time surcharge, counted from the moment the visit actually ended. */
export function overtimeCharge(order: Order, tariff: number | TariffTerms): number {
  const terms = tariffTerms(tariff)
  if (isUnlimited(terms.durationMin)) return 0
  const end = actualEnd(order)
  if (end === undefined) return 0
  return extraCharge(end - plannedEnd(order, terms.durationMin), terms)
}

/** What the surcharge would be if the order were settled right now — used
 *  by the payment window, which is the thing that closes the order. */
export function overtimeChargeAt(
  order: Order,
  tariff: number | TariffTerms,
  at: Minutes = now(),
): number {
  const terms = tariffTerms(tariff)
  if (isUnlimited(terms.durationMin)) return 0
  return extraCharge(at - plannedEnd(order, terms.durationMin), terms)
}

export function paidTotal(order: Order): number {
  return order.payments.reduce((sum, p) => sum + p.amount, 0)
}

export function refundedTotal(order: Order): number {
  return order.refunds.reduce((sum, r) => sum + r.amount, 0)
}

export interface OrderTotals {
  items: number
  discount: number
  manualDiscount: number
  overtime: number
  payable: number
  paid: number
  refunded: number
  /** What the client still owes. Never negative — an overpayment is change. */
  remainder: number
}

export function orderTotals(
  order: Order,
  client: Client | undefined,
  tariff: number | TariffTerms,
  overtimeAt?: Minutes,
): OrderTotals {
  const items = itemsTotal(order)
  const discount = discountAmount(order, client)
  const manualDiscount = order.manualDiscount
  const overtime =
    overtimeAt === undefined
      ? overtimeCharge(order, tariff)
      : overtimeChargeAt(order, tariff, overtimeAt)
  const payable = Math.max(0, items - discount - manualDiscount + overtime)
  const paid = paidTotal(order)
  const refunded = refundedTotal(order)
  return {
    items,
    discount,
    manualDiscount,
    overtime,
    payable,
    paid,
    refunded,
    remainder: Math.max(0, payable - refunded - paid),
  }
}

/** Status colour, as settled in the conversation:
 *  зелёный — оплачен, жёлтый — не оплачен,
 *  красный — не оплачен и превышение времени. */
export type StatusTone = 'success' | 'warn' | 'danger'

export function statusTone(
  order: Order,
  client: Client | undefined,
  tariff: number | TariffTerms,
): StatusTone {
  const tariffDurationMin = tariffTerms(tariff).durationMin
  // Красный — время окончания уже прошло, а заказ ещё открыт: ребёнок в зале
  // сверх оплаченного, администратору надо подойти.
  if (order.status === 'open' && !isUnlimited(tariffDurationMin)) {
    const end = actualEnd(order) ?? plannedEnd(order, tariffDurationMin)
    if (now() > end) return 'danger'
  }
  const { remainder } = orderTotals(order, client, tariff)
  return remainder > 0 ? 'warn' : 'success'
}

export function statusLabel(order: Order): string {
  return order.status === 'open' ? 'Открыт' : 'Закрыт'
}

/** The «Оплата» column: the method actually used, qualified when the
 *  order is only part-paid. */
export function paymentLabel(order: Order, totals: OrderTotals): string {
  if (order.payments.length === 0) return 'Не выбрано'
  const method = order.payments[order.payments.length - 1]!.method
  if (totals.remainder > 0) {
    const partial = order.payments.some((p) => p.title.startsWith('Предоплата'))
    return `${method} · ${partial ? 'предоплата' : 'частично'}`
  }
  return method
}
