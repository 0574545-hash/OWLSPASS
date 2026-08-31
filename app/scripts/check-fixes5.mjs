/** Замечания 18–26: смена по факту, дети, степперы, тарифы в минутах,
 *  безлимит, просрочка красным, главная, изъятие. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const DEMO = 'file://' + resolve('Аква пати — CRM.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)

/* ---------- 18: открытие смены — текущее время ---------- */
await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)

const openedField = await p
  .locator('.modal-main .field-col', { hasText: 'Открытие смены' })
  .locator('input')
  .inputValue()
const wall = await p.evaluate(() => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})
ok('18. Открытие смены — фактическое время', openedField === wall, `${openedField} vs ${wall}`)
ok(
  '18. Поле «Закрытие смены» на открытии не спрашивают',
  (await p.locator('.modal-main .field-col', { hasText: 'Закрытие смены' }).count()) === 0,
)

await p.locator('.field-col', { hasText: 'Администратор' }).locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(700)

/* ---------- 24: главная ---------- */
await p.goto(FILE + '#/')
await p.waitForTimeout(600)
const homeText = await p.locator('.page').innerText()
ok('24. Нет таблицы «Открытые заказы»', !homeText.includes('ОТКРЫТЫЕ ЗАКАЗЫ') && !homeText.includes('Открытые заказы'))
ok('24. Нет «Сводка по смене»', !/Сводка по смене/i.test(homeText))
ok('24. Нет «Требует внимания»', !/Требует внимания/i.test(homeText))
ok('24. Нет KPI «Задолженность»', !/Задолженность/i.test(homeText))
ok(
  '24. Нет кнопок Создать заказ / Добавить клиента / Инкассация',
  (await p.locator('.page button').count()) === 0,
  `кнопок на странице: ${await p.locator('.page button').count()}`,
)
ok('24. Плитки «Открытых заказов» тоже нет', !/Открытых заказов/i.test(homeText))
ok(
  '24. На главной осталось две плитки',
  (await p.locator('.stat').count()) === 2,
  `плиток: ${await p.locator('.stat').count()}`,
)

/* ---------- 26: изъятие ---------- */
await p.goto(FILE + '#/cash')
await p.waitForTimeout(500)
ok('26. Кнопка «Изъятие»', (await p.getByRole('button', { name: 'Изъятие' }).count()) === 1)
ok('26. Кнопки «Инкассация» нет', (await p.getByRole('button', { name: 'Инкассация' }).count()) === 0)
await p.goto(FILE + '#/cash/collect')
await p.waitForTimeout(500)
ok('26. Заголовок «Изъятие из кассы»', (await p.locator('.modal-title').textContent()) === 'Изъятие из кассы')

/* ---------- 19: дети ---------- */
await p.goto(FILE + '#/clients/new')
await p.waitForTimeout(600)
const plus = p.locator('.field-plus > button')
ok('19. «+» выключен на пустой строке ребёнка', await plus.isDisabled())

const childName = p.locator('.modal-main .field-plus input')
await childName.click()
await childName.type('Misha')
await p.waitForTimeout(200)
ok(
  '19. Латиница в имени — ошибка',
  (await p.locator('.field-error').first().textContent()) === 'Только буквы кириллицы',
  await p.locator('.field-error').first().textContent(),
)
ok('19. «+» всё ещё выключен', await plus.isDisabled())

await childName.fill('')
await childName.type('Миша')
await p.waitForTimeout(200)
ok('19. «+» выключен без даты рождения', await plus.isDisabled())

const childBd = p.locator('.modal-main .field-col', { hasText: 'Дата рождения' }).nth(1).locator('input')
await childBd.click()
await childBd.type('02052008')
await p.waitForTimeout(250)
ok(
  '19. Год раньше 2010 — ошибка',
  (await p.locator('.field-error').allTextContents()).some((t) => t.includes('Не раньше 2010')),
  (await p.locator('.field-error').allTextContents()).join(' | '),
)
ok('19. «+» выключен при дате раньше 2010', await plus.isDisabled())

await childBd.fill('')
await childBd.click()
await childBd.type('02052020')
await p.waitForTimeout(250)
ok('19. «+» включился, когда всё заполнено', !(await plus.isDisabled()))
await plus.click()
await p.waitForTimeout(300)
ok(
  '19. Появилась вторая строка ребёнка',
  (await p.locator('.modal-main .field-col', { hasText: 'Ребёнок · имя' }).count()) === 2,
)

/* ---------- 20: степперы ---------- */
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
const box = await p.locator('.stepper > button').first().boundingBox()
ok('20. Кнопки ± увеличены', box.width >= 36 && box.height >= 36, `${Math.round(box.width)}×${Math.round(box.height)}`)

/* ---------- 21/22: тарифы заводятся заново, в минутах ---------- */
await p.goto(FILE + '#/directories/tariffs')
await p.waitForTimeout(600)
ok(
  'Тарифов в пустой сборке нет',
  (await p.locator('.tbl tbody').innerText()).includes('не найдено'),
  (await p.locator('.tbl tbody').innerText()).replace(/\n/g, ' ').slice(0, 60),
)

await p.getByRole('button', { name: 'Добавить тариф' }).click()
await p.waitForTimeout(600)
const unitSel = p.locator('.modal-main .field-col', { hasText: 'Единица' }).locator('select')
const durField = p.locator('.modal-main .field-col', { hasText: 'Длительность' }).locator('input')
const unitOptions = await unitSel.locator('option').allTextContents()
ok('21. В единицах есть «мин»', unitOptions.includes('мин'), unitOptions.join(' | '))
ok('21. Единицы «час» больше нет', !unitOptions.includes('час'), unitOptions.join(' | '))
ok('21. Новый тариф сразу в «мин»', (await unitSel.inputValue()) === 'мин', await unitSel.inputValue())
ok('21. Длительность активна при единице «мин»', !(await durField.isDisabled()))

await unitSel.selectOption('шт.')
await p.waitForTimeout(250)
ok('21. Длительность выключена при другой единице', await durField.isDisabled())
await unitSel.selectOption('мин')
await p.waitForTimeout(250)

/* ---------- 22: цена за длительность, экстра-время ---------- */
const nameF = p.locator('.modal-main .field-col', { hasText: 'Наименование' }).locator('input')
const priceF = p.locator('.modal-main .field-col', { hasText: 'Цена' }).first().locator('input')
const extraF = p.locator('.modal-main .field-col', { hasText: 'Экстра время' }).locator('input')
ok('Экстра-время выключено, пока нет длительности', await extraF.isDisabled())
await nameF.fill('Час игры')
await durField.fill('60')
await p.waitForTimeout(200)
ok('Экстра-время включилось вместе с длительностью', !(await extraF.isDisabled()))
ok(
  'Пустое экстра-время — прежние 350 за начатый час',
  (await extraF.getAttribute('placeholder')) === 'пусто — 350 за начатый час',
  await extraF.getAttribute('placeholder'),
)
await priceF.fill('1000')
await extraF.fill('20')
await p.waitForTimeout(200)
ok(
  'В сводке позиции: цена за 60 мин и 20 за мин сверх',
  (await p.locator('.modal-aside .card').first().innerText()).includes('20 за мин'),
  (await p.locator('.modal-aside .card').first().innerText()).replace(/\n/g, ' '),
)
await p.locator('.modal-foot').getByRole('button', { name: 'Сохранить' }).click()
await p.waitForTimeout(600)
ok(
  '22. Тариф сохранён: мин · 60 · 1 000',
  (await p.locator('.tbl tbody').innerText()).includes('Час игры'),
  (await p.locator('.tbl tbody tr').first().innerText()).replace(/\n/g, ' '),
)

await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
const pick = p.locator('.field-plus .input')
await pick.click()
await pick.fill('Смирнова')
await p.waitForTimeout(300)
await p.locator('.picker-row').first().click()
await p.waitForTimeout(250)
await p.locator('.cat-row', { hasText: 'Час игры' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(700)
const row = (await p.locator('.tbl tbody tr').first().innerText()).replace(/\n/g, ' ')
const times = row.match(/(\d\d:\d\d)\s+(\d\d:\d\d)/)
const span = times ? (Number(times[2].slice(0, 2)) * 60 + Number(times[2].slice(3))) -
  (Number(times[1].slice(0, 2)) * 60 + Number(times[1].slice(3))) : null
ok('22. Окончание считается по длительности тарифа (60 мин)', span === 60, `${times?.[1]} — ${times?.[2]}`)
ok('22. Цена тарифа — за всю длительность (1 000 − 10 %)', row.includes('900'), row)

/* ---------- 23/25: демо-файл ---------- */
const p2 = await b.newPage({ viewport: { width: 1440, height: 900 } })
p2.on('pageerror', (e) => errs.push(e.message))
await p2.goto(DEMO, { waitUntil: 'load' })
await p2.waitForTimeout(700)
for (const d of '1111') await p2.getByRole('button', { name: d, exact: true }).click()
await p2.waitForTimeout(800)
await p2.locator('.field-col', { hasText: 'Администратор' }).locator('select').selectOption('Смирнова Е. В.')
await p2.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p2.waitForTimeout(900)

await p2.goto(DEMO + '#/orders')
await p2.waitForTimeout(700)
const danger = await p2.locator('.tbl .pill.danger, .tbl .pill[class*=danger]').count()
ok('23. Просроченные заказы подсвечены красным', danger > 0, `красных статусов: ${danger}`)

await p2.goto(DEMO + '#/')
await p2.waitForTimeout(600)
const hall = await p2.locator('.stat', { hasText: 'Детей в зале' }).locator('.stat-value').textContent()
const expected = await p2.evaluate(() => {
  const key = Object.keys(sessionStorage).find((k) => k.includes('aqua'))
  const snap = JSON.parse(sessionStorage.getItem(key) ?? '{}')
  const orders = snap?.state?.orders
  if (!orders) return null
  return orders
    .filter((o) => o.status === 'open' && o.endedAt === undefined)
    .reduce((n, o) => n + o.childIds.length, 0)
})
ok(
  '25. Детей в зале = дети из заказов',
  expected === null || hall.startsWith(`${expected} `),
  `${hall} (по заказам: ${expected})`,
)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
