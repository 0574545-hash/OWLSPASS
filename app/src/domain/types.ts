/** All times are minutes since midnight of the shift's day. The canvas is
 *  a single working day (30.08.2026), so a full timestamp buys nothing. */
export type Minutes = number

export type CatalogCategory = 'Тариф' | 'Услуга' | 'Товар' | 'Скидка'
export type CatalogStatus = 'active' | 'hidden' | 'pending'

export interface CatalogItem {
  id: string
  name: string
  category: CatalogCategory
  /** «чел.», «шт.», «пара», «час», «набор», «%» */
  unit: string
  price: number
  /** Tariffs and timed services carry a duration; it sets the order's
   *  окончание and therefore the over-time surcharge. */
  durationMin?: number
  status: CatalogStatus
  /** Услуги carry a sub-category and who performs them. */
  group?: string
  performer?: string
  usedInOrders?: number
  changedAt?: string
}

export interface DiscountGround {
  id: string
  name: string
  /** «Ручная» has no fixed percent — the administrator sets it per order. */
  percent: number | null
  appliesTo: string
  term: string
  proof: string
  active: boolean
}

export interface Child {
  id: string
  name: string
  birthDate: string
}

export interface ClientFile {
  name: string
  size: string
}

export interface Client {
  id: string
  fullName: string
  phone: string
  birthDate: string
  discountPct: number
  discountGround: string
  discountUntil: string
  comment: string
  file?: ClientFile
  children: Child[]
  since: string
  visits: number
  lastVisit: string
  /** Positive = prepaid / credit, negative = debt. Seeded for the clients
   *  whose history predates this shift; live orders adjust it on top. */
  seededBalance: number
  ordersTotal: number
}

export type PaymentMethod = 'Наличные' | 'Карта' | 'СБП по QR'

export interface Payment {
  id: string
  at: Minutes
  amount: number
  method: PaymentMethod
  /** «Частичная оплата», «Предоплата 50 %», «Оплата заказа» */
  title: string
  cashier: string
}

export interface OrderItem {
  id: string
  catalogItemId: string
  name: string
  unit: string
  price: number
  qty: number
}

export type OrderStatus = 'open' | 'closed'

export interface Order {
  id: string
  no: number
  createdAt: Minutes
  /** When the child actually left the hall. Recorded independently of
   *  settling the order — order № 4795 is open, the visit is over, and the
   *  over-time surcharge is already showing. */
  endedAt?: Minutes
  closedAt?: Minutes
  clientId: string
  childIds: string[]
  /** The tariff line that defines окончание. */
  tariffItemId: string
  tariffLabel: string
  items: OrderItem[]
  comment: string
  /** «Разовая скидка» — a flat one-off amount, not a percent. */
  manualDiscount: number
  payments: Payment[]
  status: OrderStatus
  refunds: Refund[]
}

export interface RefundLine {
  orderItemId: string
  qty: number
}

export interface Refund {
  id: string
  at: Minutes
  lines: RefundLine[]
  amount: number
  reason: string
  method: PaymentMethod
  by: string
}

export type CashOpKind =
  | 'Оплата заказа'
  | 'Частичная оплата'
  | 'Предоплата 50 %'
  | 'Продажа товара'
  | 'Возврат'
  | 'Выемка'
  | 'Внесение'
  | 'Не оплачено'

export interface CashOp {
  id: string
  at: Minutes
  orderNo?: number
  /** Client name, or «Инкассация» / «Открытие смены» for house operations. */
  subject: string
  kind: CashOpKind
  method: PaymentMethod | 'Не оплачено'
  amount: number
  cashier: string
}

export type ShiftStatus = 'open' | 'closed' | 'discrepancy'

export interface Shift {
  no: number
  date: string
  openedAt: Minutes
  closedAt?: Minutes
  admin: string
  cashier: string
  /** «Остаток на начало дня» — what the drawer holds when the shift opens,
   *  which is what yesterday's shift left in it. Counted by the cashier, so
   *  it can differ from the previous shift's closing figure. */
  opening: number
  ops: number
  /** Cash that went through the drawer during the shift. */
  cash: number
  cashless: number
  /** What was counted in the drawer when the shift closed. It stays there and
   *  opens the next shift as «остаток на начало дня». */
  closingCash: number
  discrepancy: number
  status: ShiftStatus
  comment?: string
}

export type UserStatus = 'working' | 'disabled'

export interface AccessRights {
  ordersPayment: boolean
  cashPayment: boolean
  clientsEdit: boolean
  catalogEdit: boolean
  settings: boolean
}

export interface User {
  id: string
  fullName: string
  role: string
  phone: string
  schedule: string
  accessSummary: string
  /** «В смене» / «Не в смене» / «Приглашён» */
  presence: 'in-shift' | 'off' | 'invited'
  pin: string
  status: UserStatus
  access: AccessRights
  shiftsThisMonth: number
  discrepancies: number
}

export interface Role {
  name: string
  people: number
  orders: string
  clients: string
  cash: string
  discounts: string
  catalog: string
}

export interface NotificationRule {
  id: string
  scenario: string
  recipient: string
  channel: string
  when: string
  enabled: boolean
}

export interface Requisites {
  name: string
  inn: string
  kpp: string
  ogrn: string
  taxation: string
  legalAddress: string
  actualAddress: string
  phone: string
  email: string
  site: string
}

export interface PaymentSettings {
  methods: { id: string; label: string; enabled: boolean }[]
  collectionGrounds: string[]
  depositGrounds: string[]
  discrepancyReasons: string[]
  refundReasons: string[]
}
