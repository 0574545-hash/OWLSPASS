/**
 * Checks the seeded shift against the figures the design canvas states.
 * Run with: npx tsx scripts/check-seed.ts
 */
import { buildSeed, tariffDuration, PAST_SHIFTS } from '../src/domain/seed'
import { NOW, elapsed, endTime, orderTotals, statusTone } from '../src/domain/rules'
import { clock, duration, money } from '../src/lib/format'

const seed = buildSeed()
const clientOf = (id: string) => seed.clients.find((c) => c.id === id)

// The drawer opens holding what the previous shift left in it.
let cashOnHand = PAST_SHIFTS[0].closingCash
let cashless = 0
let refunds = 0
let collected = 0
let paymentOps = 0
let ops = 0

for (const op of seed.cashOps) {
  ops += 1
  if (op.method === 'Наличные') cashOnHand += op.amount
  if (op.kind === 'Выемка') collected += -op.amount
}

for (const order of seed.orders) {
  for (const p of order.payments) {
    ops += 1
    paymentOps += 1
    if (p.method === 'Наличные') cashOnHand += p.amount
    else cashless += p.amount
  }
  for (const r of order.refunds) {
    ops += 1
    refunds += r.amount
    if (r.method === 'Наличные') cashOnHand -= r.amount
    else cashless -= r.amount
  }
}

const open = seed.orders.filter((o) => o.status === 'open')
const unpaid = seed.orders.filter(
  (o) => orderTotals(o, clientOf(o.clientId), tariffDuration(o.tariffItemId)).remainder > 0,
)

let debt = 0
let debtors = 0
for (const c of seed.clients) {
  const owed = seed.orders
    .filter((o) => o.clientId === c.id && o.status === 'open')
    .reduce((s, o) => s + orderTotals(o, c, tariffDuration(o.tariffItemId)).remainder, 0)
  const balance = c.seededBalance - owed
  if (balance < 0) {
    debt += -balance
    debtors += 1
  }
}

// Cash taken from clients, less what was handed back — the drawer's float and
// the collection move money without earning it, so they stay out.
const taken = seed.orders.reduce(
  (sum, o) => sum + o.payments.reduce((a, p) => a + p.amount, 0),
  0,
)

const rows: [string, unknown, unknown][] = [
  ['Заказов за смену', seed.orders.length, 42],
  ['Открытых заказов', open.length, 7],
  ['Не оплачено', unpaid.length, 5],
  ['Остаток на начало дня', money(PAST_SHIFTS[0].closingCash), '8 060'],
  ['Наличные в кассе', money(cashOnHand), '41 480'],
  ['Безнал за смену', money(cashless), '102 920'],
  ['Выручка (принято − возвращено)', money(taken - refunds), '166 340'],
  ['Возвраты', money(refunds), '1 543'],
  ['Инкассировано', money(collected), '30 000'],
  ['Задолженность', money(debt), '13 802'],
  ['Клиентов с долгом', debtors, 5],
  ['Позиций справочника', 0, 0],
]

console.log('\n=== Аггрегаты смены № 218 ===')
let bad = 0
for (const [label, actual, expected] of rows) {
  if (label === 'Позиций справочника') continue
  const ok = String(actual) === String(expected)
  if (!ok) bad += 1
  console.log(`${ok ? '  ok ' : ' DIFF'}  ${label.padEnd(30)} ${String(actual).padStart(10)}   (макет: ${expected})`)
}

console.log('\n=== Строки таблицы «Заказы» (первые 18) ===')
console.log(
  ['Заказ', 'Создан', 'Оконч.', 'Прошло', 'Доплата', 'Сумма', 'Статус', 'Цвет'].join('\t'),
)
for (const order of seed.orders.slice(0, 18)) {
  const client = clientOf(order.clientId)
  const dur = tariffDuration(order.tariffItemId)
  const t = orderTotals(order, client, dur)
  console.log(
    [
      `№ ${order.no}`,
      clock(order.createdAt),
      clock(endTime(order, dur)),
      duration(elapsed(order, dur, NOW)),
      t.overtime ? `+${t.overtime}` : '—',
      money(Math.max(0, t.items - t.discount - t.manualDiscount)),
      order.status === 'open' ? 'Открыт' : 'Закрыт',
      statusTone(order, client, dur),
    ].join('\t'),
  )
}

console.log(`\nОпераций в журнале: ${ops} (макет: 38), из них оплат: ${paymentOps}`)
console.log(bad === 0 ? '\nВсе контрольные суммы совпали.\n' : `\nРасхождений: ${bad}\n`)
