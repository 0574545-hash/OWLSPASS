/** Оба файла: пустой открывается пустым, демо — демо. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

for (const [name, file] of [
  ['ДЕМО ', 'Аква пати — CRM.html'],
  ['ПУСТО', 'Аква пати — CRM (пустая касса).html'],
]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  const errs = []
  p.on('pageerror', e => errs.push(e.message))
  await p.goto('file://' + resolve(file), { waitUntil: 'load' })
  await p.waitForTimeout(700)
  for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
  await p.waitForTimeout(500)
  const start = (await p.locator('.modal-aside .card-total > span:last-child').first().textContent())?.trim()
  await p.getByRole('button', { name: 'Открыть смену' }).click()
  await p.waitForTimeout(400)
  await p.goto('file://' + resolve(file) + '#/orders'); await p.waitForTimeout(500)
  const orders = (await p.locator('.subtab').first().textContent())?.replace(/\D/g,'')
  await p.goto('file://' + resolve(file) + '#/cash'); await p.waitForTimeout(500)
  const cash = (await p.locator('.stat-value').first().textContent())?.trim()
  console.log(`${name}  на старте ${String(start).padStart(8)} · заказов ${String(orders).padStart(3)} · в кассе ${String(cash).padStart(8)}  ${errs.length ? 'ОШИБКИ: '+errs[0] : 'ok'}`)
  await p.close()
}
await b.close()
