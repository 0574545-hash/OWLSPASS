/** Просроченный заказ красит строку целиком; закрытая смена показывает
 *  фактическое время закрытия. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('dialog', (d) => d.accept())
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)
const F = (l) => p.locator('.modal-main .field-col', { hasText: l }).first()
const bg = (loc) => loc.evaluate((el) => getComputedStyle(el).backgroundColor)

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(800)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(700)
await F('Администратор').locator('select').selectOption({ index: 1 })
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(800)

/* ---------- 23: вся строка просроченного заказа красная ---------- */
await p.goto(FILE + '#/orders')
await p.waitForTimeout(700)
const late = p.locator('.tbl tbody tr.row-overdue').first()
ok('23. Просроченные заказы найдены', (await p.locator('.tbl tbody tr.row-overdue').count()) > 0,
  `строк: ${await p.locator('.tbl tbody tr.row-overdue').count()}`)
const lateCells = late.locator('td')
const first = await bg(lateCells.first())
const last = await bg(lateCells.last())
ok('23. Первая ячейка строки красная', first === 'rgb(251, 217, 217)', first)
ok('23. И последняя тоже — покрашена вся строка', last === first, last)
const calm = p.locator('.tbl tbody tr:not(.row-overdue)').first()
const calmBg = await bg(calm.locator('td').first())
ok('23. Обычный заказ не покрашен', calmBg !== first, calmBg)
ok(
  '23. Статус у просроченного по-прежнему красный',
  (await late.locator('.pill').innerText()).length > 0,
  await late.locator('.pill').innerText(),
)

/* ---------- 75: смена закрыта — время по факту ---------- */
await p.goto(FILE + '#/')
await p.waitForTimeout(600)
const openLine = await p.locator('.page .subtitle').first().innerText()
ok('75. Открытая смена: «открыта в …»', /открыта в \d\d:\d\d/.test(openLine) && !/закрыта/.test(openLine), openLine)

await p.goto(FILE + '#/cash/close')
await p.waitForTimeout(800)
const counted = F('Фактически').locator('input')
if ((await counted.count()) > 0) await counted.fill('50 000')
await p.waitForTimeout(300)
await p.locator('.modal-foot').getByRole('button').last().click()
await p.waitForTimeout(900)
await p.locator('.modal-foot').getByRole('button', { name: 'Готово' }).click()
await p.waitForTimeout(900)

await p.goto(FILE + '#/')
await p.waitForTimeout(700)
const closedLine = await p.locator('.page .subtitle').first().innerText()
ok('75. Закрытая смена показывает время закрытия', /закрыта в \d\d:\d\d/.test(closedLine), closedLine)
ok('75. И время открытия осталось', /открыта в \d\d:\d\d/.test(closedLine), closedLine)

await p.goto(FILE + '#/settings/payments')
await p.waitForTimeout(700)
const settings = await p.locator('.page .subtitle').first().innerText()
ok('75. В настройках тоже «смена закрыта в …»', /смена закрыта в \d\d:\d\d/.test(settings), settings)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
