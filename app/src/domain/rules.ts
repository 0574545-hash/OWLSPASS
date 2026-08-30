import type { Client, Minutes, Order } from './types'

/** «при закрытии заказа время сверх тарифа начисляется автоматически
 *  по 350 за час» — the rate lives in the catalog as «Доплата за час
 *  сверх тарифа»; this is the id and the rounding rule. */
export const OVERTIME_ITEM_ID = 'tariff-overtime'
export const OVERTIME_RATE = 350

/** The moment the canvas is drawn at: every «Прошло» value in the orders
 *  table resolves against 15:00 on 30.08.2026. */
export const NOW: Minutes = 15 * 60
export const SHIFT_DATE = '30.08.2026'

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

/** The moment the visit actually finished, if it has: the closing time for
 *  a settled order, otherwise the recorded exit. */
export function actualEnd(order: Order): Minutes | undefined {
  return order.closedAt ?? order.endedAt
}

/** «Окончание» as shown in the orders table — the actual end once the visit
 *  is over, the planned end while the child is still in the hall. */
export function endTime(order: Order, tariffDurationMin: number): Minutes {
  return actualEnd(order) ?? plannedEnd(order, tariffDurationMin)
}

/** «Прошло». While the visit runs the clock stops at the planned end — the
 *  order simply has not been settled yet. */
export function elapsed(order: Order, tariffDurationMin: number, now: Minutes = NOW): Minutes {
  const end = actualEnd(order) ?? Math.min(now, plannedEnd(order, tariffDurationMin))
  return Math.max(0, end - order.createdAt)
}

/** Over-time surcharge, billed per started hour, counted from the moment
 *  the visit actually ended. */
export function overtimeCharge(order: Order, tariffDurationMin: number): number {
  const end = actualEnd(order)
  if (end === undefined) return 0
  const over = end - plannedEnd(order, tariffDurationMin)
  if (over <= 0) return 0
  return Math.ceil(over / 60) * OVERTIME_RATE
}

/** What the surcharge would be if the order were settled right now — used
 *  by the payment window, which is the thing that closes the order. */
export function overtimeChargeAt(
  order: Order,
  tariffDurationMin: number,
  at: Minutes = NOW,
): number {
  const over = at - plannedEnd(order, tariffDurationMin)
  if (over <= 0) return 0
  return Math.ceil(over / 60) * OVERTIME_RATE
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
  tariffDurationMin: number,
  overtimeAt?: Minutes,
): OrderTotals {
  const items = itemsTotal(order)
  const discount = discountAmount(order, client)
  const manualDiscount = order.manualDiscount
  const overtime =
    overtimeAt === undefined
      ? overtimeCharge(order, tariffDurationMin)
      : overtimeChargeAt(order, tariffDurationMin, overtimeAt)
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
  tariffDurationMin: number,
): StatusTone {
  const { remainder, overtime } = orderTotals(order, client, tariffDurationMin)
  if (remainder <= 0) return 'success'
  return overtime > 0 ? 'danger' : 'warn'
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
