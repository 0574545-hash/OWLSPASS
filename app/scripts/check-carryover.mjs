/** Проверяет переключатель «Остаток кассы переходит на следующую смену». */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(e.message))
const txt = async s => (await p.locator(s).first().textContent())?.trim()

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(500)
console.log('ВЫКЛ — в кассе на старте:', await txt('.modal-aside .card-total > span:last-child'))
await p.getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(400)
await p.goto(FILE + '#/cash'); await p.waitForTimeout(500)
console.log('ВЫКЛ — наличные в кассе :', await txt('.stat-value'))

// Включаем переключатель и сохраняем
await p.goto(FILE + '#/settings/payments'); await p.waitForTimeout(600)
await p.getByText('Остаток кассы переходит на следующую смену').click()
await p.getByRole('button', { name: 'Сохранить' }).first().click()
await p.waitForTimeout(400)
await p.goto(FILE + '#/cash'); await p.waitForTimeout(500)
console.log('ВКЛ  — наличные в кассе :', await txt('.stat-value'))
const stats = await p.locator('.stat').allTextContents()
console.log('ВКЛ  — выручка не должна измениться:', stats[1].replace(/\s+/g,' ').trim())

await p.goto(FILE + '#/cash/close'); await p.waitForTimeout(600)
console.log('ВКЛ  — выручка при закрытии:', await txt('.modal-aside .card-total > span:last-child'))
await b.close()
console.log(errs.length ? 'ОШИБКИ: ' + errs.join(' | ') : 'Ошибок нет.')
