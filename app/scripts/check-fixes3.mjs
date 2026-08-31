/** Поиск на «Заказах» выводит ФИО; клик подставляет клиента в новый заказ. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { addTariff } from './lib-tariff.mjs'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(e.message))
const ok = (n, c, x='') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)

await p.goto(FILE, { waitUntil: 'load' }); await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)
await p.locator('.field-col', { hasText: 'Администратор' }).locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(600)
// Тарифы заказчик заводит сам — создаём тот, на котором построен сценарий.
await addTariff(p, FILE)

const box = p.locator('.search-wrap .input')
await box.click(); await box.fill('Зыков'); await p.waitForTimeout(400)

const rows = await p.locator('.picker-row').allTextContents()
ok('Поиск выводит ФИО клиента', rows.length === 1 && rows[0].includes('Зыков'), rows[0])
ok('Надписи «нет заказов» больше нет',
   !(await p.locator('.tbl tbody tr').first().textContent())?.includes('нет заказов'))

await p.locator('.picker-row').first().click(); await p.waitForTimeout(600)
ok('Открылся «Новый заказ»', (await p.locator('.modal-title').textContent()) === 'Новый заказ')
const picked = await p.locator('.modal-main .field-plus .input').inputValue()
ok('Клиент подставлен', picked === 'Зыков Денис Максимович', picked)

// и заказ реально создаётся на него
await p.locator('.cat-row', { hasText: 'Разовое посещение, 2 ч' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(600)
const row = (await p.locator('.tbl tbody tr').first().textContent())?.replace(/\s+/g,' ')
ok('Заказ создан на этого клиента', row?.includes('Зыков'), row?.slice(0, 60))

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
