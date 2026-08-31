/** Проверяет шесть замечаний заказчика. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { addTariff } from './lib-tariff.mjs'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(e.message))
p.on('dialog', d => d.accept())
const ok = (n, cond, extra='') => console.log(`  ${cond ? 'ok  ' : 'ПЛОХО'} ${n}${extra ? '  — ' + extra : ''}`)

await p.goto(FILE, { waitUntil: 'load' }); await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(500)
await p.locator('.field-col', { hasText: 'Администратор' }).locator('select').selectOption('Смирнова Е. В.'); await p.waitForTimeout(150)
await p.getByRole('button', { name: 'Открыть смену' }).click(); await p.waitForTimeout(400)
// Тарифы заказчик заводит сам — создаём тот, на котором построен сценарий.
await addTariff(p, FILE)

await p.goto(FILE + '#/orders/new'); await p.waitForTimeout(600)
const field = p.locator('.field-plus .input')

// 2 — пустое по умолчанию
ok('2. Поле клиента пустое по умолчанию', (await field.inputValue()) === '')
const createBtn = p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' })
ok('   «Создать заказ» выключено без клиента', await createBtn.isDisabled())

// 1 — поиск по телефону
await field.click(); await p.waitForTimeout(200)
await field.fill('916 802'); await p.waitForTimeout(300)
const byPhone = await p.locator('.picker-row').allTextContents()
ok('1. Поиск по телефону', byPhone.length === 1 && byPhone[0].includes('Кузнецова'), byPhone[0]?.slice(0,40))

// 1 — поиск по ФИО
await field.fill('ковал'); await p.waitForTimeout(300)
ok('1. Поиск по ФИО', (await p.locator('.picker-row').count()) === 1)

// 1 — поиск по имени ребёнка
await field.fill('амина'); await p.waitForTimeout(300)
const byChild = await p.locator('.picker-row').allTextContents()
ok('1. Поиск по имени ребёнка', byChild.length === 1 && byChild[0].includes('Насибуллин'))

// выбор подставляется
await p.locator('.picker-row').first().click(); await p.waitForTimeout(300)
ok('1. Выбор подставился в поле', (await field.inputValue()).includes('Насибуллин'))

// 3–4 — после создания окно закрывается
const plus = p.locator('.cat-row', { hasText: 'Разовое посещение, 2 ч' }).getByRole('button', { name: 'Увеличить' })
await plus.click(); await p.waitForTimeout(200)
await createBtn.click(); await p.waitForTimeout(600)
ok('3. Окно закрылось после создания', (await p.locator('.modal').count()) === 0)
ok('4. Карточка заказа не открылась', !p.url().includes('/orders/48'))
ok('   Заказ появился в списке', (await p.locator('.tbl tbody tr').count()) === 1)

// 5–6 — выключенные кнопки видно, и они объясняют причину
await p.locator('.tbl tbody tr').first().click(); await p.waitForTimeout(500)
const closeBtn = p.locator('.modal-foot').getByRole('button', { name: 'Закрыть заказ' })
const refundBtn = p.getByRole('button', { name: 'Оформить возврат' })
ok('5. «Закрыть заказ» выключена при остатке', await closeBtn.isDisabled(),
   await closeBtn.getAttribute('title'))
const opacity = await closeBtn.evaluate(el => getComputedStyle(el).opacity)
ok('5. Видно, что выключена (opacity)', Number(opacity) < 0.6, `opacity ${opacity}`)
ok('6. «Оформить возврат» выключена без оплат', await refundBtn.isDisabled(),
   await refundBtn.getAttribute('title'))

// после оплаты обе оживают
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click(); await p.waitForTimeout(400)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click(); await p.waitForTimeout(600)
await p.locator('.tbl tbody tr').first().click(); await p.waitForTimeout(500)
ok('6. После оплаты «Оформить возврат» доступна',
   !(await p.getByRole('button', { name: 'Оформить возврат' }).isDisabled()))

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
