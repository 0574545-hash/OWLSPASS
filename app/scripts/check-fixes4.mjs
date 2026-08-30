/** Замечания 13–17: маски даты и телефона, порядок полей, автопереход, файл. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
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

await p.goto(FILE + '#/clients/new'); await p.waitForTimeout(600)
const F = (label) => p.locator('.modal-main .field-col', { hasText: label }).locator('input,select').first()

// 15 — порядок полей
const labels = await p.locator('.modal-main .form-grid').nth(1).locator('.field-col').allTextContents()
ok('15. Основание перед скидкой', labels[0].includes('Основание') && labels[1].includes('Скидка'),
   labels.map(l => l.split('\n')[0]).join(' | '))

// 14 — телефон
const phone = F('Телефон')
await phone.click(); await phone.type('+7 (921) 448-12-06')
ok('14. Телефон 10 цифр без +7', (await phone.inputValue()) === '9214481206', await phone.inputValue())

// 16 — автопереход после телефона
ok('16. Фокус ушёл дальше после телефона',
   await p.evaluate(() => document.activeElement?.getAttribute('placeholder')) === 'дд.мм.гггг',
   await p.evaluate(() => document.activeElement?.getAttribute('placeholder')))

// 13 — дата: точки сами
await p.keyboard.type('14031991')
const bd = await F('Дата рождения').inputValue()
ok('13. Точки в дате ставятся сами', bd === '14.03.1991', bd)

// 16 — автопереход после даты
ok('16. Фокус ушёл дальше после даты',
   await p.evaluate(() => document.activeElement?.tagName) === 'SELECT',
   await p.evaluate(() => document.activeElement?.tagName))

// 13 — дата ребёнка
const childBd = p.locator('.modal-main .field-col', { hasText: 'Дата рождения' }).nth(1).locator('input')
await childBd.click(); await childBd.type('02052020')
ok('13. Дата ребёнка тоже с точками', (await childBd.inputValue()) === '02.05.2020', await childBd.inputValue())

// 17 — файл выбирается
writeFileSync('/tmp/udostoverenie.pdf', 'x'.repeat(3000))
await p.locator('.file-row input[type=file]').setInputFiles('/tmp/udostoverenie.pdf')
await p.waitForTimeout(300)
ok('17. Файл загружается', (await p.locator('.file-name').textContent()) === 'udostoverenie.pdf',
   (await p.locator('.file-name').textContent()) + ' · ' + (await p.locator('.file-size').textContent()))

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
