/** Исправления по итогам тестирования: 30 пунктов. */
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
const F = (label) => p.locator('.modal-main .field-col', { hasText: label }).first()

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)

/* ---------- 13: список администраторов ---------- */
const adminOptions = await F('Администратор').locator('select option').allTextContents()
ok(
  '13. Не в смене помечены в списке администраторов',
  adminOptions.some((t) => t.includes('не в смене') || t.includes('приглашён')),
  adminOptions.filter(Boolean).join(' | '),
)
await F('Администратор').locator('select').selectOption({ index: 1 })
await p.waitForTimeout(300)
const openBtn = p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' })
const chosen = await F('Администратор').locator('select').inputValue()
if (/не в смене|приглашён/.test(chosen)) {
  ok('13. Выбор не работающего требует подтверждения', await openBtn.isDisabled(), chosen)
  await p.locator('.modal-main [role=checkbox]').first().click()
  await p.waitForTimeout(200)
  ok('13. После подтверждения смену открыть можно', !(await openBtn.isDisabled()))
} else {
  ok('13. Работающий администратор выбирается без подтверждений', !(await openBtn.isDisabled()), chosen)
}
await openBtn.click()
await p.waitForTimeout(800)

/* ---------- 14: статус сотрудника ---------- */
await p.goto(FILE + '#/settings')
await p.waitForTimeout(600)
const shiftAdmin = (await p.locator('.subtitle').first().innerText()).match(/администратор ([^,]+)/)
await p.waitForTimeout(200)
const usersTable = await p.locator('.tbl tbody').innerText()
ok(
  '14. Администратор смены переведён «В смене»',
  (usersTable.match(/В смене/g) ?? []).length >= 2,
  `строк «В смене»: ${(usersTable.match(/В смене/g) ?? []).length}${shiftAdmin ? ` · ${shiftAdmin[1]}` : ''}`,
)

/* ---------- 18: день недели и дата ---------- */
await p.goto(FILE + '#/')
await p.waitForTimeout(600)
const head = await p.locator('.page .subtitle').first().innerText()
const expectWeekday = await p.evaluate(() => {
  const w = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  return w[new Date().getDay()]
})
ok('18. День недели считается из даты', head.startsWith(expectWeekday), `${head.split(' · ')[0]} vs ${expectWeekday}`)
const title = await p.locator('.page .h1').first().innerText()
const expectDay = await p.evaluate(() => String(new Date().getDate()))
ok('18. Дата смены — сегодняшняя', title.includes(expectDay), title)

/* ---------- 9, 10, 12: клиент ---------- */
await p.goto(FILE + '#/clients/new')
await p.waitForTimeout(600)
const create = p.locator('.modal-foot').getByRole('button', { name: 'Создать' })
await F('ФИО родителя').locator('input').fill('Петров Пётр Петрович')
const phone = F('Телефон').locator('input')
await phone.click()
await phone.type('123')
await p.waitForTimeout(250)
ok('9. Телефон в маске', (await phone.inputValue()) === '+7 (123)', await phone.inputValue())
ok('9. Неполный телефон блокирует «Создать»', await create.isDisabled())
await phone.fill('')
await phone.type('9214481299')
await p.waitForTimeout(250)
ok('9. Полный телефон в маске', (await phone.inputValue()) === '+7 (921) 448-12-99', await phone.inputValue())
ok('9. С полным телефоном «Создать» доступна', !(await create.isDisabled()))

const bd = F('Дата рождения родителя').locator('input')
await bd.click()
await bd.type('99999999')
await p.waitForTimeout(250)
ok(
  '10. «99.99.9999» не принимается',
  (await p.locator('.field-error').allTextContents()).some((t) => t.includes('не бывает')),
  (await p.locator('.field-error').allTextContents()).join(' | '),
)
ok('10. Битая дата блокирует «Создать»', await create.isDisabled())
await bd.fill('')
await bd.click()
await bd.type('01012099')
await p.waitForTimeout(250)
ok(
  '10. Дата в будущем не принимается',
  (await p.locator('.field-error').allTextContents()).some((t) => t.includes('будущем')),
  (await p.locator('.field-error').allTextContents()).join(' | '),
)
await bd.fill('')
await p.waitForTimeout(200)

/* ---------- 3: скидка ---------- */
const disc = F('Скидка').locator('input')
await disc.click()
await disc.type('150')
await p.waitForTimeout(250)
ok('3. Скидка обрезана до 100 %', (await disc.inputValue()) === '100 %', await disc.inputValue())
ok(
  '3. Скидка без основания не сохраняется',
  (await p.locator('.field-error').allTextContents()).some((t) => t.includes('основание')),
  (await p.locator('.field-error').allTextContents()).join(' | '),
)
ok('3. И блокирует «Создать»', await create.isDisabled())
await F('Основание скидки').locator('select').selectOption('Многодетная семья')
await p.waitForTimeout(250)
ok('3. С основанием — можно', !(await create.isDisabled()))
await create.click()
await p.waitForTimeout(700)

// 12 — дубликат по телефону
await p.goto(FILE + '#/clients/new')
await p.waitForTimeout(600)
await F('ФИО родителя').locator('input').fill('Сидоров Сидор')
await F('Телефон').locator('input').type('9214481299')
await p.waitForTimeout(300)
ok(
  '12. Дубликат по телефону виден',
  (await p.locator('.field-error').allTextContents()).some((t) => t.includes('уже есть')),
  (await p.locator('.field-error').allTextContents()).join(' | '),
)
ok('12. И блокирует создание', await p.locator('.modal-foot').getByRole('button', { name: 'Создать' }).isDisabled())
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* ---------- 27: телефон в списке ---------- */
await p.goto(FILE + '#/clients')
await p.waitForTimeout(600)
ok(
  '27. Телефоны в списке отформатированы',
  (await p.locator('.tbl tbody').innerText()).includes('+7 (921) 448-12-99'),
  (await p.locator('.tbl tbody tr').first().innerText()).replace(/\t/g, ' '),
)

/* ---------- 1, 2, 6: закрытый заказ ---------- */
await addTariff(p, FILE, { name: 'Час игры', min: 60, price: 1000 })
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
const pick = p.locator('.field-plus .input').first()
await pick.click()
await pick.fill('Петров')
await p.waitForTimeout(300)
await p.locator('.picker-row').first().click()
await p.waitForTimeout(250)
await p.locator('.cat-row', { hasText: 'Час игры' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(800)
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(600)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(600)

/* ---------- 24: карта без сдачи ---------- */
await p.locator('.modal-main [role=checkbox], .modal-main .pill-btn').filter({ hasText: 'Карта' }).first().click()
await p.waitForTimeout(300)
ok('24. При карте «Внесено» заблокировано', await F('Внесено').locator('input').isDisabled())
ok('24. При карте «Сдача» скрыта', !(await p.locator('.modal-aside').innerText()).includes('Сдача'))
await p.locator('.modal-main .pill-btn').filter({ hasText: 'Наличные' }).first().click()
await p.waitForTimeout(300)
ok('24. При наличных сдача снова видна', (await p.locator('.modal-aside').innerText()).includes('Сдача'))
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)

await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(600)
ok(
  '6. «Оплачено» без минуса',
  /Оплачено\s*850/.test((await p.locator('.modal-aside').innerText()).replace(/\n/g, ' ')),
  (await p.locator('.modal-aside').innerText()).replace(/\n/g, ' ').match(/Оплачено[^А-Я]*/)?.[0] ?? '',
)
ok('1. Степперы закрытого заказа заблокированы', await p.locator('.stepper > button').first().isDisabled())
ok(
  '1. Есть «Вернуть в работу»',
  (await p.locator('.modal-foot').getByRole('button', { name: 'Вернуть в работу' }).count()) === 1,
)

await p.locator('.modal-foot').getByRole('button', { name: 'Вернуть в работу' }).click()
await p.waitForTimeout(500)
ok('1. После возврата в работу состав правится', !(await p.locator('.stepper > button').first().isDisabled()))
await p.locator('.cat-row', { hasText: 'Час игры' }).getByRole('button', { name: 'Увеличить' }).click()
await p.waitForTimeout(500)
const aside = (await p.locator('.modal-aside').innerText()).replace(/\n/g, ' ')
// Второй час игры: 2 000 − 15 % = 1 700, оплачено 850 → остаётся 850.
ok('2. Остаток пересчитался', /Остаток\s*850/.test(aside), aside.match(/Остаток[^А-Я]*/)?.[0] ?? aside)
ok('2. Статус вернулся в «Открыт»', aside.includes('Открыт'), aside.match(/Статус[^А-Я]*Открыт/)?.[0] ?? '')

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
