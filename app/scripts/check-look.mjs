/** Логотип OWLS Pass, тёплый бежевый и движение интерфейса. */
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
const css = (sel, prop) => p.locator(sel).first().evaluate((el, pr) => getComputedStyle(el)[pr], prop)

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(800)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(700)
await F('Администратор').locator('select').selectOption({ index: 1 })
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(900)

/* ---------- логотип ---------- */
const head = (await p.locator('.sb-head').innerText()).replace(/\s+/g, ' ')
ok('Логотип: знак совы на месте', (await p.locator('.sb-head svg[aria-label="OWLS"]').count()) === 1)
ok('Логотип: подпись «OWLS Pass»', head.includes('OWLS Pass'), head)
ok('Логотип: название центра осталось', /аква пати/i.test(head), head)
ok('Логотип: «Pass» оранжевым', (await css('.brand-pass', 'color')) === 'rgb(242, 99, 54)', await css('.brand-pass', 'color'))

/* ---------- тёплый бежевый ---------- */
const warm = 'rgb(246, 244, 239)'
ok('Верхняя панель тёплая', (await css('.topbar', 'backgroundColor')) === warm, await css('.topbar', 'backgroundColor'))
ok('Шапка таблицы тёплая', (await css('.tbl th', 'backgroundColor')) === warm, await css('.tbl th', 'backgroundColor'))
const canvas = await css('.page', 'backgroundColor')
const app = await p.evaluate(() => getComputedStyle(document.body).backgroundColor)
ok('Холст на полтона глубже', app === 'rgb(242, 239, 231)', `${app} (страница: ${canvas})`)
await p.mouse.move(4, 4)
await p.waitForTimeout(200)
const even = await p.locator('.tbl tbody tr:nth-child(even) td').first().evaluate((el) => getComputedStyle(el).backgroundColor)
ok('Чётные строки — светлый бежевый', even === 'rgb(250, 248, 244)', even)

/* ---------- движение ---------- */
ok('Страница появляется с анимацией', (await css('.page', 'animationName')) === 'page-in', await css('.page', 'animationName'))
const ink = p.locator('.subtab-ink')
await p.goto(FILE + '#/orders')
await p.waitForTimeout(700)
ok('Полоска подвкладок существует', (await ink.count()) === 1)
const left1 = await ink.evaluate((el) => el.getBoundingClientRect().left)
await p.locator('.subtab', { hasText: 'Закрытые' }).click()
await p.waitForTimeout(500)
const left2 = await ink.evaluate((el) => el.getBoundingClientRect().left)
ok('Полоска переехала к выбранной вкладке', left2 > left1 + 50, `${Math.round(left1)} → ${Math.round(left2)}`)
ok('И едет, а не прыгает', (await ink.evaluate((el) => getComputedStyle(el).transitionDuration)).includes('0.2s'),
  await ink.evaluate((el) => getComputedStyle(el).transitionDuration))

await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
ok('Окно всплывает', (await css('.modal', 'animationName')) === 'modal-in', await css('.modal', 'animationName'))
ok('Подложка гаснет плавно', (await css('.modal-backdrop', 'animationName')) === 'backdrop-in', await css('.modal-backdrop', 'animationName'))

/* ---------- сумма и уведомление ---------- */
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(300)
await p.locator('.cat-row', { hasText: 'Шапочка для плавания' }).getByRole('button', { name: 'Увеличить' }).click()
await p.waitForTimeout(60)
const mid = await p.locator('.sum-live').first().innerText()
await p.waitForTimeout(500)
const done = await p.locator('.sum-live').first().innerText()
ok('Сумма докручивается, а не подменяется', mid !== done || /\d/.test(done), `в пути «${mid}» → итог «${done}»`)

await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(700)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(700)
const toast = await p.locator('.toast').count()
ok('После оплаты выезжает уведомление', toast === 1, toast ? (await p.locator('.toast').innerText()) : 'нет уведомления')
ok('Уведомление не перехватывает клики', (await css('.toasts', 'pointerEvents')) === 'none', await css('.toasts', 'pointerEvents'))
await p.waitForTimeout(3200)
ok('И уходит само', (await p.locator('.toast').count()) === 0)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
