/**
 * Замер запаса по размеру шрифта: насколько можно увеличить текст, пока
 * вёрстка не поплывёт. Гоняет живую сборку при 1440×900 и 1280×800 в двух
 * режимах — «крупнее только текст» и «крупнее весь интерфейс» — и печатает,
 * где появляется горизонтальная прокрутка и сколько заказов остаётся видно.
 *
 *   node scripts/measure-type.mjs
 */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

const scaleFonts = (k) => {
  const els = [...document.querySelectorAll('*')]
  const sizes = els.map((el) => parseFloat(getComputedStyle(el).fontSize))
  els.forEach((el, i) => { el.style.fontSize = (sizes[i] * k).toFixed(2) + 'px' })
}

async function probe(page, where) {
  return page.evaluate(() => {
    const r = {}
    const de = document.documentElement
    r.pageOverflow = de.scrollWidth - de.clientWidth
    const sb = document.querySelector('.sb')
    r.sbOverflow = sb ? Math.max(...[...sb.querySelectorAll('.sb-item')].map((e) => e.scrollWidth - e.clientWidth)) : 0
    const tb = document.querySelector('.topbar')
    r.topbarOverflow = tb ? tb.scrollWidth - tb.clientWidth : 0
    const holder = document.querySelector('[data-compact] > div')
    r.tableScroll = holder ? holder.scrollWidth - holder.clientWidth : 0
    const rows = [...document.querySelectorAll('.tbl tbody tr')].slice(0, 12)
    r.rowH = rows.length ? Math.round(rows.reduce((s, e) => s + e.getBoundingClientRect().height, 0) / rows.length) : 0
    r.rowsVisible = document.querySelector('.tbl') ? rows.filter((e) => {
      const rc = e.getBoundingClientRect()
      return rc.top >= 0 && rc.bottom <= innerHeight
    }).length : 0
    const main = document.querySelector('.modal-main')
    r.modalMainScroll = main ? main.scrollHeight - main.clientHeight : null
    const aside = document.querySelector('.modal-aside')
    r.modalAsideScroll = aside ? aside.scrollHeight - aside.clientHeight : null
    const foot = document.querySelector('.modal-foot')
    r.modalFootOverflow = foot ? foot.scrollWidth - foot.clientWidth : null
    const head = document.querySelector('.page .h1')
    r.h1 = head ? Math.round(parseFloat(getComputedStyle(head).fontSize)) : 0
    const cell = document.querySelector('.tbl tbody td')
    r.cell = cell ? parseFloat(getComputedStyle(cell).fontSize).toFixed(1) : 0
    return r
  })
}

const report = []
for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
  for (const mode of ['fonts', 'zoom']) {
    for (const k of [1, 1.08, 1.15, 1.25, 1.4]) {
      if (mode === 'zoom' && k === 1) continue
      const p = await b.newPage({ viewport: vp })
      await p.goto(FILE, { waitUntil: 'load' })
      await p.waitForTimeout(600)
      for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
      await p.waitForTimeout(500)
      await p.locator('.modal-main .field-col', { hasText: 'Администратор' }).locator('select').selectOption({ index: 1 })
      await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
      await p.waitForTimeout(700)
      await p.goto(FILE + '#/orders')
      await p.waitForTimeout(600)
      if (mode === 'fonts') await p.evaluate(scaleFonts, k)
      else await p.evaluate((z) => { document.body.style.zoom = String(z) }, k)
      await p.waitForTimeout(400)
      const list = await probe(p)
      await p.goto(FILE + '#/orders/4810')
      await p.waitForTimeout(700)
      if (mode === 'fonts') await p.evaluate(scaleFonts, k)
      else await p.evaluate((z) => { document.body.style.zoom = String(z) }, k)
      await p.waitForTimeout(400)
      const modal = await probe(p)
      report.push({ vp: `${vp.width}×${vp.height}`, mode, k, list, modal })
      await p.close()
    }
  }
}
await b.close()
for (const r of report) {
  console.log(
    `${r.vp} ${r.mode.padEnd(5)} ×${r.k.toFixed(2)}`,
    `| ячейка ${r.list.cell}px h1 ${r.list.h1}px строка ${r.list.rowH}px видно ${r.list.rowsVisible}`,
    `| страница+${r.list.pageOverflow} меню+${r.list.sbOverflow} шапка+${r.list.topbarOverflow} таблица+${r.list.tableScroll}`,
    `| окно: форма+${r.modal.modalMainScroll} сводка+${r.modal.modalAsideScroll} подвал+${r.modal.modalFootOverflow}`,
  )
}
