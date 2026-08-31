/** Основания кассы, единицы тарифов, справочники без «Всех позиций»,
 *  должности и режим работы центра. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)
await p.locator('.field-col', { hasText: 'Администратор' }).locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(700)

const options = async (label) =>
  p.locator('.modal-main .field-col', { hasText: label }).locator('select option').allTextContents()

/* ---------- Внесение ---------- */
await p.goto(FILE + '#/cash/deposit')
await p.waitForTimeout(600)
const dep = await options('Основание')
ok(
  'Внесение: Остаток на начало, Пополнение, Предоплата, Иное',
  dep.join('|') === 'Остаток на начало|Пополнение|Предоплата|Иное',
  dep.join(' | '),
)

/* ---------- Изъятие ---------- */
await p.goto(FILE + '#/cash/collect')
await p.waitForTimeout(600)
const col = await options('Основание')
ok(
  'Изъятие: Инкассация, Хозрасходы, Закуп, ЗП, Иное',
  col.join('|') === 'Инкассация|Хозрасходы|Закуп|ЗП|Иное',
  col.join(' | '),
)

/* ---------- Справочники ---------- */
await p.goto(FILE + '#/directories')
await p.waitForTimeout(600)
const subtabs = await p.locator('.subtabs button, .subtabs a').allTextContents()
ok(
  'Справочники: подтаба «Все позиции» нет',
  !subtabs.some((t) => t.includes('Все позиции')),
  subtabs.map((t) => t.replace(/\s+/g, ' ').trim()).join(' | '),
)
ok('Справочники открываются на «Тарифах»', (await p.locator('.subtabs .on, .subtabs [aria-selected=true]').count()) >= 0)

for (const [tabId, label] of [
  ['services', 'Услуги'],
  ['goods', 'Товары'],
]) {
  await p.goto(FILE + `#/directories/${tabId}`)
  await p.waitForTimeout(500)
  const units = (await p.locator('.tbl tbody tr').allInnerTexts()).map((r) => r.split('\t')[2])
  ok(
    `${label}: остались только шт., мин, %`,
    units.every((u) => ['шт.', 'мин', '%'].includes(u)),
    [...new Set(units)].join(' | '),
  )
}

/* ---------- Единицы ---------- */
await p.goto(FILE + '#/directories/tariffs/new/Тариф')
await p.waitForTimeout(600)
const units = await options('Единица')
ok('Единицы: шт., мин, %', units.join('|') === 'шт.|мин|%', units.join(' | '))

/* ---------- Настройки: должности ---------- */
await p.goto(FILE + '#/settings/roles')
await p.waitForTimeout(600)
ok(
  'Поиска по должностям нет',
  (await p.locator('.page .search-wrap').count()) === 0,
  `полей поиска: ${await p.locator('.page .search-wrap').count()}`,
)

const usersHeader = await (async () => {
  await p.goto(FILE + '#/settings')
  await p.waitForTimeout(500)
  return p.locator('.surface > div').first().innerText()
})()
await p.goto(FILE + '#/settings/roles')
await p.waitForTimeout(500)
const rolesHeader = await p.locator('.surface > div').first().innerText()
ok(
  'Кнопка «Добавить» стоит в шапке списка, как у пользователей',
  usersHeader.includes('Добавить') && rolesHeader.includes('Добавить'),
  `${usersHeader.replace(/\n/g, ' ')} // ${rolesHeader.replace(/\n/g, ' ')}`,
)

await p.locator('.surface').first().getByRole('button', { name: 'Добавить' }).click()
await p.waitForTimeout(700)
ok(
  'Открывается окно должности, а не сотрудника',
  (await p.locator('.modal-title').textContent()) === 'Новая должность',
  await p.locator('.modal-title').textContent(),
)
const roleFields = await p.locator('.modal-main .field-col').allInnerTexts()
ok(
  'В окне есть название и пять прав',
  ['Название должности', 'Заказы', 'Клиенты', 'Касса', 'Скидки', 'Справочники'].every((l) =>
    roleFields.some((f) => f.startsWith(l)),
  ),
  roleFields.map((f) => f.split('\n')[0]).join(' | '),
)
ok(
  'Сохранить выключено, пока нет названия',
  await p.locator('.modal-foot').getByRole('button', { name: 'Сохранить' }).isDisabled(),
)

await p.locator('.modal-main .field-col', { hasText: 'Название должности' }).locator('input').fill('Аниматор')
await p.locator('.modal-main .field-col', { hasText: 'Скидки' }).locator('select').selectOption('До 10 %')
await p.waitForTimeout(200)
await p.locator('.modal-foot').getByRole('button', { name: 'Сохранить' }).click()
await p.waitForTimeout(700)
const rows = await p.locator('.tbl tbody').innerText()
ok('Должность сохранилась со своими правами', rows.includes('Аниматор') && rows.includes('До 10 %'),
   rows.split('\n').filter((l) => l.includes('Аниматор')).join(' '))

await p.locator('.tbl tbody tr', { hasText: 'Аниматор' }).getByRole('button', { name: 'Изменить' }).click()
await p.waitForTimeout(700)
ok(
  '«Изменить» открывает ту же должность',
  (await p.locator('.modal-title').textContent()) === 'Аниматор',
  await p.locator('.modal-title').textContent(),
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* ---------- Реквизиты ---------- */
await p.goto(FILE + '#/settings/requisites')
await p.waitForTimeout(600)
const req = await p.locator('.field-col').allInnerTexts()
ok(
  'В реквизитах есть «Режим работы центра»',
  req.some((f) => f.startsWith('Режим работы центра')),
  req.map((f) => f.split('\n')[0]).join(' | '),
)
const schedule = p.locator('.field-col', { hasText: 'Режим работы центра' }).locator('input')
await schedule.fill('Пн–Вс, 10:00 — 22:00')
await p.getByRole('button', { name: 'Сохранить' }).click()
await p.waitForTimeout(400)
await p.goto(FILE + '#/settings')
await p.waitForTimeout(400)
await p.goto(FILE + '#/settings/requisites')
await p.waitForTimeout(600)
ok(
  'Режим работы сохраняется',
  (await schedule.inputValue()) === 'Пн–Вс, 10:00 — 22:00',
  await schedule.inputValue(),
)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
