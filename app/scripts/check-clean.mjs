/** Проходит ваш сценарий на пустой кассе: внесение → заказ → оплата → сверка. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(e.message))
p.on('dialog', d => d.accept())
const txt = async s => (await p.locator(s).first().textContent())?.trim()
const step = (n, v) => console.log(`  ${n.padEnd(38)} ${String(v).padStart(10)}`)

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(500)
await p.getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(400)

// Обнуляем
await p.goto(FILE + '#/settings/payments'); await p.waitForTimeout(600)
await p.getByRole('button', { name: 'Обнулить кассу и заказы' }).click()
await p.waitForTimeout(600)

console.log('\n=== Пустая смена ===')
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(500)
step('В кассе на старте', await txt('.modal-aside .card-total > span:last-child'))
await p.getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(400)
await p.goto(FILE + '#/cash'); await p.waitForTimeout(500)
step('Наличные в кассе', await txt('.stat-value'))
step('Строк в журнале', await p.locator('.tbl tbody tr').count())

console.log('\n=== 1. Внесение 5 000 ===')
await p.goto(FILE + '#/cash/deposit'); await p.waitForTimeout(600)
await p.locator('.modal-foot').getByRole('button', { name: 'Внести' }).click()
await p.waitForTimeout(500)
step('Наличные в кассе', await txt('.stat-value'))
step('Операций в журнале', await p.locator('.tbl tbody tr').count())

console.log('\n=== 2. Новый заказ ===')
await p.goto(FILE + '#/orders/new'); await p.waitForTimeout(600)
// Клиент теперь выбирается поиском, сам не подставляется
const field = p.locator('.field-plus .input')
await field.click(); await field.fill('Смирнова'); await p.waitForTimeout(300)
await p.locator('.picker-row').first().click(); await p.waitForTimeout(200)
// Разовое посещение × 2
const plus = p.locator('.cat-row', { hasText: 'Разовое посещение, 2 ч' }).getByRole('button', { name: 'Увеличить' })
await plus.click(); await plus.click()
await p.waitForTimeout(200)
step('К оплате в расчёте', await txt('.modal-aside .card-total > span:last-child'))
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(600)
step('Окно закрылось', (await p.locator('.modal').count()) === 0 ? 'да' : 'нет')

console.log('\n=== 3. Открыть заказ из списка и оплатить ===')
await p.locator('.tbl tbody tr').first().click(); await p.waitForTimeout(500)
step('Номер заказа', (await txt('.modal-title')) ?? '—')
step('Остаток по заказу', await txt('.modal-aside .card-total > span:last-child'))
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(500)
step('К оплате', await txt('.modal-aside .card-total > span:last-child'))
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(600)

await p.goto(FILE + '#/cash'); await p.waitForTimeout(500)
const stats = await p.locator('.stat').allTextContents()
console.log('\n=== 4. Касса после оплаты ===')
for (const s of stats) console.log('   ', s.replace(/\s+/g,' ').trim())
console.log('\n    Журнал:')
for (const r of await p.locator('.tbl tbody tr').allTextContents())
  console.log('      ', r.replace(/\s+/g,' ').trim())

console.log('\n=== 5. Закрытие смены ===')
await p.goto(FILE + '#/cash/close'); await p.waitForTimeout(600)
for (const r of await p.locator('.modal-aside .card').first().locator('.card-row').allTextContents())
  console.log('   ', r.replace(/\s+/g,' ').trim())
step('Выручка', await txt('.modal-aside .card-total > span:last-child'))

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
