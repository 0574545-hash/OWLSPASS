/** Экстра-время: цена минуты сверх тарифа. */
import { OVERTIME_RATE, orderTotals, overtimeCharge } from '../src/domain/rules'
import type { Order } from '../src/domain/types'

const ok = (n: string, c: boolean, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)

/** Заказ на 1 000, открыт в 10:00, фактически закончился в 11:25. */
function order(endedAt: number): Order {
  return {
    id: 'o-1',
    no: 1,
    clientId: 'c-1',
    childIds: [],
    createdAt: 10 * 60,
    endedAt,
    status: 'open',
    tariffItemId: 't-1',
    tariffLabel: 'Час игры',
    items: [{ id: 'i-1', catalogItemId: 't-1', name: 'Час игры', unit: 'мин', price: 1000, qty: 1 }],
    payments: [],
    refunds: [],
    manualDiscount: 0,
    comment: '',
  }
}

const o = order(11 * 60 + 25) // 85 минут в зале при тарифе 60 → 25 минут сверх

console.log('\n=== Экстра-время ===')

const perMin = overtimeCharge(o, { durationMin: 60, extraPerMin: 20 })
ok('25 минут сверх по 20 за мин = 500', perMin === 500, String(perMin))

const perMin7 = overtimeCharge(o, { durationMin: 60, extraPerMin: 7 })
ok('по 7 за мин = 175', perMin7 === 175, String(perMin7))

const free = overtimeCharge(o, { durationMin: 60, extraPerMin: 0 })
ok('цена 0 — экстра-время бесплатно', free === 0, String(free))

const legacy = overtimeCharge(o, { durationMin: 60 })
ok(`цена не задана — прежние ${OVERTIME_RATE} за начатый час`, legacy === OVERTIME_RATE, String(legacy))

const asNumber = overtimeCharge(o, 60)
ok('старый вызов числом работает как раньше', asNumber === legacy, String(asNumber))

const unlimited = overtimeCharge(o, { durationMin: 0, extraPerMin: 20 })
ok('безлимитный тариф — доплаты нет', unlimited === 0, String(unlimited))

const inTime = overtimeCharge(order(10 * 60 + 40), { durationMin: 60, extraPerMin: 20 })
ok('уложились в тариф — доплаты нет', inTime === 0, String(inTime))

const totals = orderTotals(o, undefined, { durationMin: 60, extraPerMin: 20 })
ok('в сумме заказа: 1 000 + 500 = 1 500', totals.payable === 1500, String(totals.payable))
ok('доплата показана отдельной строкой', totals.overtime === 500, String(totals.overtime))

console.log('')
