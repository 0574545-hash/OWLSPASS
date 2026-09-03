/** Вариант А: текст на 8 % крупнее, вёрстка на месте. */
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
const size = (sel) => p.locator(sel).first().evaluate((el) => Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10)

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(800)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(700)
await F('Администратор').locator('select').selectOption({ index: 1 })
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(900)

const scale = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--type-scale').trim())
ok('Размер задаётся одним числом', scale === '1.08', scale)

await p.goto(FILE + '#/orders')
await p.waitForTimeout(800)
ok('Текст страницы 14 px вместо 13', (await size('body')) === 15.1 || (await size('.subtab')) === 14, `подвкладка ${await size('.subtab')} px`)
ok('Ячейка таблицы 13 px вместо 12', (await size('.tbl tbody td')) === 13, `${await size('.tbl tbody td')} px`)
ok('Заголовок раздела 30 px вместо 28', (await size('.page .h1')) === 30.2, `${await size('.page .h1')} px`)
ok('Подпись под заголовком подросла', (await size('.page .subtitle')) > 13, `${await size('.page .subtitle')} px`)

const geom = await p.evaluate(() => {
  const de = document.documentElement
  const holder = document.querySelector('[data-compact] > div')
  const rows = [...document.querySelectorAll('.tbl tbody tr')].slice(0, 12)
  return {
    page: de.scrollWidth - de.clientWidth,
    table: holder ? holder.scrollWidth - holder.clientWidth : 0,
    rowH: Math.round(rows.reduce((s, e) => s + e.getBoundingClientRect().height, 0) / rows.length),
    visible: rows.filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }).length,
    sb: Math.max(...[...document.querySelectorAll('.sb-item')].map((e) => e.scrollWidth - e.clientWidth)),
    topbar: (() => { const t = document.querySelector('.topbar'); return t ? t.scrollWidth - t.clientWidth : 0 })(),
  }
})
ok('Страница не поехала вширь', geom.page === 0, `перебор ${geom.page} px`)
ok('Таблица помещается по ширине', geom.table === 0, `перебор ${geom.table} px`)
ok('Пункты меню не обрезаны', geom.sb <= 0, `перебор ${geom.sb} px`)
ok('Верхняя панель цела', geom.topbar === 0, `перебор ${geom.topbar} px`)
ok('Строка выросла умеренно', geom.rowH >= 74 && geom.rowH <= 84, `${geom.rowH} px`)
ok('Заказов видно не меньше шести', geom.visible >= 6, `${geom.visible}`)

/* ---------- окно ---------- */
await p.goto(FILE + '#/orders/4810')
await p.waitForTimeout(800)
const win = await p.evaluate(() => {
  const foot = document.querySelector('.modal-foot')
  const aside = document.querySelector('.modal-aside')
  const title = document.querySelector('.modal-title')
  return {
    foot: foot.scrollWidth - foot.clientWidth,
    aside: aside.scrollHeight - aside.clientHeight,
    title: Math.round(parseFloat(getComputedStyle(title).fontSize) * 10) / 10,
  }
})
ok('Кнопки в подвале окна в одну строку', win.foot === 0, `перебор ${win.foot} px`)
ok('Сводка справа помещается целиком', win.aside === 0, `перебор ${win.aside} px`)
ok('Заголовок окна подрос', win.title > 22, `${win.title} px`)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
