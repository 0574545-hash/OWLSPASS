/** Ограничение в 200 символов и удаление удержанием 2 секунды. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { addTariff } from './lib-tariff.mjs'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('dialog', (d) => d.accept())
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)
const F = (l) => p.locator('.modal-main .field-col', { hasText: l }).first()

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)
await F('Администратор').locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(800)

/* ---------- 200 символов ---------- */
const long = 'а'.repeat(260)
await p.goto(FILE + '#/clients/new')
await p.waitForTimeout(700)
const fio = F('ФИО родителя').locator('input')
await fio.fill(long)
await p.waitForTimeout(300)
ok('Поле ФИО обрезано до 200', (await fio.inputValue()).length === 200, `символов: ${(await fio.inputValue()).length}`)

const note = F('Комментарий').locator('textarea')
await note.fill(long)
await p.waitForTimeout(300)
ok('Комментарий обрезан до 200', (await note.inputValue()).length === 200, `символов: ${(await note.inputValue()).length}`)

// вставка из буфера тоже обрезается
await fio.fill('')
await p.evaluate(() => navigator.clipboard?.writeText?.('я'.repeat(400)).catch(() => {}))
await fio.evaluate((el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}, 'я'.repeat(400))
await p.waitForTimeout(300)
ok('Вставка длинного текста тоже обрезается', (await fio.inputValue()).length === 200, `символов: ${(await fio.inputValue()).length}`)

await p.goto(FILE + '#/directories/tariffs/new/Тариф')
await p.waitForTimeout(700)
const catName = F('Наименование').locator('input')
await catName.fill(long)
await p.waitForTimeout(300)
ok('Наименование позиции обрезано до 200', (await catName.inputValue()).length === 200, `символов: ${(await catName.inputValue()).length}`)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

await p.goto(FILE + '#/orders')
await p.waitForTimeout(600)
const search = p.locator('.search-wrap .input')
await search.fill(long)
await p.waitForTimeout(300)
ok('Поиск обрезан до 200', (await search.inputValue()).length === 200, `символов: ${(await search.inputValue()).length}`)

/* ---------- удаление удержанием ---------- */
await p.goto(FILE + '#/settings/payments')
await p.waitForTimeout(800)
const card = p.locator('.card', { hasText: 'Основания для внесения' })
const before = await card.locator('.ref-row').count()
const del = card.locator('.ref-row').first().getByRole('button', { name: 'Удалить' })
ok('У пункта настроек есть «Удалить»', (await del.count()) === 1, `пунктов: ${before}`)
ok(
  'Кнопка объясняет, что надо держать',
  (await del.getAttribute('title'))?.includes('2 секунды'),
  await del.getAttribute('title'),
)

// короткий клик ничего не удаляет
await del.click()
await p.waitForTimeout(500)
ok('Быстрый клик не удаляет', (await card.locator('.ref-row').count()) === before, `пунктов: ${await card.locator('.ref-row').count()}`)

// удержание меньше двух секунд — тоже нет
const box = await del.boundingBox()
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await p.mouse.down()
await p.waitForTimeout(1200)
await p.mouse.up()
await p.waitForTimeout(400)
ok('Отпустили через 1,2 с — не удаляет', (await card.locator('.ref-row').count()) === before, `пунктов: ${await card.locator('.ref-row').count()}`)

// держим больше двух секунд
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await p.mouse.down()
await p.waitForTimeout(700)
const label = await card.locator('.ref-row').first().locator('.hold-label').last().innerText()
await p.waitForTimeout(1700)
await p.mouse.up()
await p.waitForTimeout(500)
ok('Во время удержания кнопка меняет подпись', label.includes('Не отпускайте'), label)
ok(
  'Удержание 2,4 с удаляет пункт',
  (await card.locator('.ref-row').count()) === before - 1,
  `было ${before}, стало ${await card.locator('.ref-row').count()}`,
)

/* ---------- корзина в справочнике ---------- */
await addTariff(p, FILE, { name: 'Пробный тариф', min: 30, price: 300 })
await p.goto(FILE + '#/directories/tariffs')
await p.waitForTimeout(700)
const rows = await p.locator('.tbl tbody tr').count()
await p.locator('.tbl tbody tr', { hasText: 'Пробный тариф' }).first().click()
await p.waitForTimeout(700)
const trash = p.locator('.modal-foot').getByRole('button', { name: 'Удалить' })
ok('У позиции справочника есть корзина', (await trash.count()) === 1, (await p.locator('.modal-foot').innerText()).replace(/\s+/g, ' '))
ok(
  'Корзина объясняет, что надо держать',
  (await trash.getAttribute('title'))?.includes('2 секунды'),
  await trash.getAttribute('title'),
)
await trash.click()
await p.waitForTimeout(500)
ok('Быстрый клик по корзине не удаляет', (await trash.count()) === 1)

const tbox = await trash.boundingBox()
await p.mouse.move(tbox.x + tbox.width / 2, tbox.y + tbox.height / 2)
await p.mouse.down()
await p.waitForTimeout(2400)
await p.mouse.up()
await p.waitForTimeout(700)
ok(
  'Удержание корзины открывает подтверждение',
  (await p.locator('.modal-title').innerText()).includes('Удал'),
  await p.locator('.modal-title').innerText(),
)
await p.locator('.modal-foot').getByRole('button', { name: 'Удалить' }).click()
await p.waitForTimeout(800)
await p.goto(FILE + '#/directories/tariffs')
await p.waitForTimeout(600)
const left = (await p.locator('.tbl tbody').innerText()).replace(/\s+/g, ' ')
ok('После подтверждения позиция удалена', !left.includes('Пробный тариф'), `было ${rows}, осталось: ${left.slice(0, 80)}`)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
