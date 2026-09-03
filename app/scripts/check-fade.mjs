/** Затухание окна при закрытии: копия гаснет на месте и уходит сама. */
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
const ghost = () => p.locator('.modal-ghost-backdrop')

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(800)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(700)
await F('Администратор').locator('select').selectOption({ index: 1 })
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(900)

/* ---------- закрытие крестиком ---------- */
await p.goto(FILE + '#/orders/4810')
await p.waitForTimeout(700)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(80)
ok('Копия окна остаётся на экране', (await ghost().count()) === 1)
ok('Само окно из разметки ушло сразу', (await p.locator('.modal-backdrop').count()) === 0)
const anim = await ghost().locator('.modal-ghost-win').evaluate((el) => {
  const s = getComputedStyle(el)
  return `${s.animationName} ${s.animationDuration}`
})
ok('Окно гаснет на месте', anim === 'modal-out 0.36s', anim)
const back = await ghost().evaluate((el) => {
  const s = getComputedStyle(el)
  return `${s.animationName} ${s.animationDuration}`
})
ok('Затемнение гаснет чуть дольше', back === 'backdrop-out 0.42s', back)
ok('Копия не перехватывает клики', (await ghost().evaluate((el) => getComputedStyle(el).pointerEvents)) === 'none')
const win = ghost().locator('.modal-ghost-win')
const early = Number(await win.evaluate((el) => getComputedStyle(el).opacity))
await p.waitForTimeout(150)
const later = Number(await win.evaluate((el) => getComputedStyle(el).opacity))
ok('Копия гаснет постепенно', early > 0 && later < early, `${early.toFixed(2)} → ${later.toFixed(2)}`)
await p.waitForTimeout(450)
ok('И убирает себя сама', (await ghost().count()) === 0)

/* ---------- список под копией работает сразу ---------- */
await p.goto(FILE + '#/orders/4810')
await p.waitForTimeout(700)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(100)
await p.locator('.subtab', { hasText: 'Закрытые' }).click()
await p.waitForTimeout(400)
const tab = (await p.locator('.subtab.active').innerText()).replace(/\s+/g, ' ')
ok('Под копией список кликается', tab.includes('Закрытые'), tab)

/* ---------- окно сменило окно — гасить нечего ---------- */
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(700)
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(300)
await p.locator('.cat-row', { hasText: 'Шапочка для плавания' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(120)
ok('Заказ → оплата: копии нет, окно просто сменилось', (await ghost().count()) === 0)
ok('И новое окно на месте', (await p.locator('.modal').count()) === 1)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(120)
ok('После оплаты окно затухает', (await ghost().count()) === 1)
await p.waitForTimeout(700)
ok('Уведомление осталось видно поверх', (await p.locator('.toast').count()) === 1,
  (await p.locator('.toast').count()) ? await p.locator('.toast').innerText() : '')
ok('Копия ушла', (await ghost().count()) === 0)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
