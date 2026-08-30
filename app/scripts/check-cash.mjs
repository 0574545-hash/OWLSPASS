/** Проверяет, что лента кассы сходится: старт → операции → сейчас → оплата. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(e.message))
await p.goto('file://' + resolve('Аква пати — CRM.html'), { waitUntil: 'load' })
await p.waitForTimeout(800)
const txt = async s => (await p.locator(s).first().textContent())?.trim()

for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(500)
const rows = await p.locator('.modal-aside .card').first().locator('.card-row').allTextContents()
const start = await txt('.modal-aside .card-total > span:last-child')
console.log('Окно открытия смены:')
for (const r of rows) console.log('   ', r.replace(/\s+/g,' ').trim())
console.log('    В кассе на старте:', start)

await p.getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(500)
console.log('\nГлавная — выручка за смену:', await txt('.stat-value'))

await p.getByRole('link', { name: 'Касса' }).click()
await p.waitForTimeout(500)
const stats = await p.locator('.stat').allTextContents()
console.log('\nКасса:')
for (const s of stats) console.log('   ', s.replace(/\s+/g,' ').trim())

await p.goto('file://' + resolve('Аква пати — CRM.html') + '#/cash/close')
await p.waitForTimeout(700)
const close = await p.locator('.modal-aside .card').first().locator('.card-row').allTextContents()
console.log('\nЗакрытие смены:')
for (const r of close) console.log('   ', r.replace(/\s+/g,' ').trim())
console.log('    Выручка:', await txt('.modal-aside .card-total > span:last-child'))
await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
