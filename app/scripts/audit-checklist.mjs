/** Пройти чек-лист заказчика (43 пункта) по собранному файлу и вынести
 *  вердикт по каждому. Ничего не правит — только проверяет. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { addTariff, setPostpay } from './lib-tariff.mjs'

const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('dialog', (d) => d.accept())

const results = []
const say = (no, verdict, note = '') => {
  results.push({ no, verdict, note })
  const mark = verdict === 'ОК' ? 'ok   ' : verdict === 'ЧАСТИЧНО' ? 'ЧАСТ ' : 'НЕТ  '
  console.log(`  ${mark} ${String(no).padStart(2)}  ${note}`)
}
const F = (label) => p.locator('.modal-main .field-col', { hasText: label }).first()
const flat = async (sel) => (await p.locator(sel).innerText()).replace(/\s+/g, ' ').trim()

const openShift = async (pin = '4444') => {
  await p.goto(FILE, { waitUntil: 'load' })
  await p.waitForTimeout(700)
  for (const d of pin) await p.getByRole('button', { name: d, exact: true }).click()
  await p.waitForTimeout(700)
}

console.log('\n=== Чек-лист заказчика: 43 пункта ===\n')

/* ---------- 7, 8, 16, 18: открытие смены ---------- */
await openShift()
const cashier = await F('Кассир').locator('input').inputValue()
const adminEmpty = (await F('Администратор').locator('select').inputValue()) === ''
say(7, cashier !== '' && adminEmpty ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `кассир «${cashier}», администратор пуст: ${adminEmpty}`)

const opened = await F('Открытие смены').locator('input').inputValue()
const wall = await p.evaluate(() => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})
say(18, opened === wall ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `открытие ${opened}, часы ${wall}`)

await F('Администратор').locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(800)
say(8, p.url().includes('/orders') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `после открытия: ${p.url().split('#')[1]}`)

/* ---------- 9, 10, 11, 1: поиск ---------- */
await p.locator('.search-wrap .search-plus').click()
await p.waitForTimeout(700)
const plusTitle = await p.locator('.modal-title').textContent()
say(9, plusTitle === 'Добавить клиента' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `«+» открыл: ${plusTitle}`)

/* 13, 16, 71: маски и автопереход — заодно заведём клиента */
const fio = F('ФИО родителя').locator('input')
await fio.fill('Смирнов Олег Иванович')
const ph = F('Телефон').locator('input')
await ph.click()
await ph.type('9214480001')
await p.waitForTimeout(300)
const focusAfterPhone = await p.evaluate(() => document.activeElement?.getAttribute('placeholder'))
await p.keyboard.type('14031991')
await p.waitForTimeout(300)
const bdValue = await F('Дата рождения родителя').locator('input').inputValue()
say(13, bdValue === '14.03.1991' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `дата набрана цифрами → ${bdValue}`)
say(16, focusAfterPhone === 'дд.мм.гггг' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `после телефона фокус: ${focusAfterPhone}`)

/* 15: порядок «Основание скидки» → «Скидка» */
const discRow = await p.locator('.modal-main .form-grid').nth(1).locator('.field-col').allInnerTexts()
const order = discRow.map((t) => t.split('\n')[0].trim())
say(
  15,
  order[0]?.startsWith('Основание') && order[1]?.startsWith('Скидка') ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  order.join(' → '),
)

/* 17: файл основания */
const tmp = '/tmp/osnovanie.pdf'
await p.evaluate(() => undefined)
const { writeFileSync } = await import('node:fs')
writeFileSync(tmp, 'x'.repeat(2048))
await p.locator('.file-row input[type=file]').setInputFiles(tmp)
await p.waitForTimeout(400)
const fileName = await p.locator('.file-name').textContent()
say(17, fileName === 'osnovanie.pdf' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `файл: ${fileName}`)
await p.locator('.modal-foot').getByRole('button', { name: 'Создать' }).click()
await p.waitForTimeout(700)

/* 10, 11 */
const box = p.locator('.search-wrap .input')
await box.fill('см')
await p.waitForTimeout(400)
const short = await flat('.tbl tbody')
await box.fill('Смирнов')
await p.waitForTimeout(500)
const hits = await p.locator('.picker-row').count()
say(11, short.includes('не менее 3') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `на 2 символах: ${short.slice(0, 60)}`)
say(10, hits > 0 ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `подсказок по «Смирнов»: ${hits}`)
const hintText = hits > 0 ? await p.locator('.picker-row').first().innerText() : ''
say(
  71,
  /\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}/.test(hintText.replace(/\n/g, ' ')) ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  hintText.replace(/\n/g, ' · ').slice(0, 60),
)
await box.fill('')
await p.waitForTimeout(300)

/* ---------- 2, 1, 3, 4, 20, 21, 30: создание заказа ---------- */
await addTariff(p, FILE, { name: 'Час игры', min: 60, price: 1000 })
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(700)
const clientField = p.locator('.field-plus .input').first()
say(2, (await clientField.inputValue()) === '' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', 'поле «Клиент» при открытии')

const stepper = await p.locator('.stepper > button').first().boundingBox()
say(20, stepper.width >= 36 && stepper.height >= 36 ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `${Math.round(stepper.width)}×${Math.round(stepper.height)} px`)

await clientField.click()
await clientField.fill('Смирнов')
await p.waitForTimeout(400)
const pickerRows = await p.locator('.picker-row').count()
await p.locator('.picker-row').first().click()
await p.waitForTimeout(300)
const picked = await clientField.inputValue()
say(1, pickerRows > 0 && picked.includes('Смирнов') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `подставлен: ${picked}`)

await p.locator('.cat-row', { hasText: 'Час игры' }).getByRole('button', { name: 'Увеличить' }).click()
await setPostpay(p)
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(800)
say(3, (await p.locator('.modal').count()) === 0 ? 'ОК' : 'НЕ ИСПРАВЛЕНО', 'окно после «Создать заказ»')
say(4, (await p.locator('.modal').count()) === 0 && p.url().includes('/orders') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', 'карточка сама не открылась')

/* 35: столбец «Комментарий» */
const head = await flat('.tbl thead')
say(35, head.includes('Комментарий') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', head)

/* 21, 30: единицы и длительность */
await p.goto(FILE + '#/directories/tariffs/new/Тариф')
await p.waitForTimeout(700)
const units = await F('Единица').locator('select option').allTextContents()
const dur = F('Длительность').locator('input')
const durOnMin = !(await dur.isDisabled())
await F('Единица').locator('select').selectOption('шт.')
await p.waitForTimeout(300)
const durOffOther = await dur.isDisabled()
say(30, units.join('|') === 'шт.|мин|%' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', units.join(' | '))
say(21, !units.includes('час') && durOnMin && durOffOther ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `«час» нет; длительность вкл/выкл: ${durOnMin}/${durOffOther}`)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* 29: подтабы справочников */
await p.goto(FILE + '#/directories')
await p.waitForTimeout(600)
const subtabs = await flat('.subtabs')
say(29, !subtabs.includes('Все позиции') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', subtabs)

/* 69: заголовок при правке */
await p.goto(FILE + '#/directories/goods')
await p.waitForTimeout(600)
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(700)
await F('Наименование').locator('input').fill('')
await p.waitForTimeout(300)
const titleOnEmpty = await p.locator('.modal-title').textContent()
say(69, titleOnEmpty === 'Редактирование позиции' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `заголовок: ${titleOnEmpty}`)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* ---------- 5, 6, 12, 23: заказ, оплата, возврат ---------- */
await p.goto(FILE + '#/orders')
await p.waitForTimeout(600)
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(700)
const payBtn = p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' })
await payBtn.click()
await p.waitForTimeout(700)

/* 67, 68: подсказки и оплата картой */
const given = F('Внесено').locator('input')
await given.fill('')
await given.type('100')
await p.waitForTimeout(300)
const payDisabledTitle = await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).getAttribute('title')
say(
  67,
  (payDisabledTitle ?? '').toLowerCase().includes('постоплата') ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  `подсказка: ${payDisabledTitle}`,
)
await p.locator('.modal-main .pill-btn').filter({ hasText: 'Карта' }).first().click()
await p.waitForTimeout(400)
const cardLocked = await given.isDisabled()
const changeHidden = !(await flat('.modal-aside')).includes('Сдача')
say(68, cardLocked && changeHidden ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `поле заблокировано: ${cardLocked}, сдача скрыта: ${changeHidden}`)
await p.locator('.modal-main .pill-btn').filter({ hasText: 'Наличные' }).first().click()
await p.waitForTimeout(300)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(900)

await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(700)
const refundOpen = p.getByRole('button', { name: 'Оформить возврат' })
const refundEnabled = !(await refundOpen.isDisabled())
await refundOpen.click()
await p.waitForTimeout(800)
const refundTitle = await p.locator('.modal-title').textContent()
say(6, refundEnabled && (refundTitle ?? '').startsWith('Возврат') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `открылось: ${refundTitle}`)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(500)

/* 5: закрытие заказа */
await p.goto(FILE + '#/orders')
await p.waitForTimeout(600)
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(700)
const closeOrderBtn = p.locator('.modal-foot').getByRole('button', { name: 'Закрыть заказ' })
const closeState = (await closeOrderBtn.count()) > 0 ? await closeOrderBtn.isDisabled() : null
say(
  5,
  closeState === true ? 'ОК' : 'ЧАСТИЧНО',
  closeState === true ? 'оплаченный заказ уже закрыт, кнопка погашена' : `состояние кнопки: ${closeState}`,
)

/* 12: «Чек» из журнала кассы */
await p.goto(FILE + '#/cash')
await p.waitForTimeout(700)
await p.locator('.tbl tbody tr').first().getByRole('button', { name: 'Чек' }).click()
await p.waitForTimeout(800)
const receiptTitle = await p.locator('.modal-title').textContent()
const noSteppers = (await p.locator('.stepper').count()) === 0
const commentLocked = await p.locator('.modal-main textarea').isDisabled()
say(
  12,
  (receiptTitle ?? '').startsWith('Чек по заказу') && noSteppers && commentLocked ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  `${receiptTitle}; степперов нет: ${noSteppers}; комментарий заблокирован: ${commentLocked}`,
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* 76: кнопка документа у внесения */
await p.goto(FILE + '#/cash/deposit')
await p.waitForTimeout(600)
await F('Сумма внесения').locator('input').fill('')
await F('Сумма внесения').locator('input').type('3000')
await p.locator('.modal-foot').getByRole('button', { name: 'Внести' }).click()
await p.waitForTimeout(800)
const depositRow = p.locator('.tbl tbody tr', { hasText: 'Внесение' }).first()
const depositBtnCount = await depositRow.getByRole('button').count()
const depositBtnDisabled = depositBtnCount > 0 ? await depositRow.getByRole('button').first().isDisabled() : null
say(
  76,
  depositBtnCount === 0 ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  depositBtnCount === 0 ? 'кнопки у внесения нет' : `кнопка есть, заблокирована: ${depositBtnDisabled}`,
)

/* 26, 27, 28, 65, 73 */
const cashButtons = (await p.locator('.page button').allInnerTexts()).map((t) => t.trim())
say(26, cashButtons.some((t) => t === 'Изъятие') && !cashButtons.some((t) => t === 'Инкассация') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', cashButtons.filter(Boolean).slice(0, 4).join(' | '))
const cashTile = await flat('.stat:first-child')
say(65, !cashTile.includes('после инкассации') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', cashTile)

await p.goto(FILE + '#/cash/deposit')
await p.waitForTimeout(600)
const dep = await F('Основание').locator('select option').allTextContents()
say(27, dep.join('|') === 'Остаток на начало|Пополнение|Предоплата|Иное' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', dep.join(' | '))
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

await p.goto(FILE + '#/cash/collect')
await p.waitForTimeout(600)
const col = await F('Основание').locator('select option').allTextContents()
say(28, col.join('|') === 'Инкассация|Хозрасходы|Закуп|ЗП|Иное' ? 'ОК' : 'НЕ ИСПРАВЛЕНО', col.join(' | '))
await F('Сумма выемки').locator('input').fill('')
await p.waitForTimeout(300)
const collectAside = await flat('.modal-aside')
say(73, !collectAside.includes('−0') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', collectAside.slice(0, 70))
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* ---------- 24, 61, 75: дашборд ---------- */
await p.goto(FILE + '#/')
await p.waitForTimeout(700)
const home = await flat('.page')
const gone = ['Открытые заказы', 'Сводка по смене', 'Требует внимания', 'Задолженность', 'Инкассация', 'Создать заказ', 'Добавить клиента']
const stillThere = gone.filter((t) => home.includes(t))
say(24, stillThere.length === 0 ? 'ОК' : 'НЕ ИСПРАВЛЕНО', stillThere.length ? `осталось: ${stillThere.join(', ')}` : 'все блоки убраны')

const expectWeekday = await p.evaluate(() => {
  const w = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  return w[new Date().getDay()]
})
const subtitle = await flat('.page .subtitle')
say(61, subtitle.startsWith(expectWeekday) ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `${subtitle.split(' · ')[0]} (сегодня ${expectWeekday})`)

/* 70: подписи дат в карточке клиента */
await p.goto(FILE + '#/clients')
await p.waitForTimeout(600)
const clientPhones = await flat('.tbl tbody')
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(800)
const labels = (await p.locator('.modal-main .field-col').allInnerTexts()).map((t) => t.split('\n')[0].trim())
say(70, labels.some((l) => l === 'Дата рождения родителя') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', labels.slice(0, 5).join(' | '))
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* 71 в списке клиентов */
say(
  71.1,
  /\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}/.test(clientPhones) ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  clientPhones.slice(0, 60),
)

/* ---------- 31, 32, 33: настройки ---------- */
await p.goto(FILE + '#/settings/roles')
await p.waitForTimeout(700)
const searchOnRoles = await p.locator('.page .search-wrap').count()
const rolesHeader = await flat('.surface > div:first-child')
await p.goto(FILE + '#/settings')
await p.waitForTimeout(500)
const usersHeader = await flat('.surface > div:first-child')
say(
  31,
  searchOnRoles === 0 && rolesHeader.includes('Добавить') && usersHeader.includes('Добавить') ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  `поиск: ${searchOnRoles}; шапки: «${usersHeader}» / «${rolesHeader}»`,
)

await p.goto(FILE + '#/settings/roles')
await p.waitForTimeout(600)
await p.locator('.surface').first().getByRole('button', { name: 'Добавить' }).click()
await p.waitForTimeout(800)
const roleTitle = await p.locator('.modal-title').textContent()
const rights = await p.locator('.modal-main [role=checkbox]').count()
say(33, roleTitle === 'Новая должность' && rights > 0 ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `${roleTitle}, прав в окне: ${rights}`)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

await p.goto(FILE + '#/settings/requisites')
await p.waitForTimeout(700)
const reqLabels = (await p.locator('.field-col').allInnerTexts()).map((t) => t.split('\n')[0].trim())
say(32, reqLabels.includes('Режим работы центра') ? 'ОК' : 'НЕ ИСПРАВЛЕНО', reqLabels.slice(-3).join(' | '))

/* ---------- 23: подсветка просроченного заказа ---------- */
await p.goto(FILE + '#/orders')
await p.waitForTimeout(600)
const dangerPill = await p.locator('.tbl .pill[class*=danger]').count()
const dangerRow = await p.locator('.tbl tbody tr[class*=danger], .tbl tbody tr.overdue').count()
say(
  23,
  dangerPill > 0 && dangerRow > 0 ? 'ОК' : dangerPill > 0 ? 'ЧАСТИЧНО' : 'НЕ ВОСПРОИЗВОДИТСЯ',
  `красных статусов: ${dangerPill}, красных строк: ${dangerRow}`,
)

/* ---------- 72: вёрстка при 1200 px ---------- */
await p.setViewportSize({ width: 1200, height: 900 })
await p.waitForTimeout(600)
const clip = await p.evaluate(() => {
  const wrap = document.querySelector('[data-compact] > div')
  const table = wrap?.querySelector('table')
  if (!wrap || !table) return null
  return {
    scrollable: wrap.scrollWidth > wrap.clientWidth,
    pageScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    lastCellVisible: (() => {
      const th = table.querySelectorAll('thead th')
      const last = th[th.length - 1]
      if (!last) return false
      wrap.scrollLeft = wrap.scrollWidth
      return last.getBoundingClientRect().right <= wrap.getBoundingClientRect().right + 2
    })(),
  }
})
say(
  72,
  clip && clip.scrollable && clip.lastCellVisible ? 'ОК' : 'ЧАСТИЧНО',
  clip ? `скролл в таблице: ${clip.scrollable}, страница шире окна: ${clip.pageScroll}, последняя колонка доступна: ${clip.lastCellVisible}` : 'таблица не найдена',
)
await p.setViewportSize({ width: 1440, height: 900 })
await p.waitForTimeout(400)

/* ---------- 66, 74, 75: закрытие смены ---------- */
await p.goto(FILE + '#/cash/close')
await p.waitForTimeout(800)
await p.locator('.modal-foot').getByRole('button', { name: 'Закрыть смену' }).click()
await p.waitForTimeout(900)
await p.locator('.modal-foot').getByRole('button', { name: 'Готово' }).click()
await p.waitForTimeout(900)
const stillIn = (await p.locator('.sb').count()) === 1
say(74, stillIn ? 'ОК' : 'НЕ ИСПРАВЛЕНО', stillIn ? `остались в системе: ${p.url().split('#')[1]}` : 'выбросило на PIN')

await p.goto(FILE + '#/')
await p.waitForTimeout(700)
const homeClosed = await flat('.page .subtitle')
const topbar = await flat('.topbar')
// Смена закрывается по факту времени: если в шапке она закрыта, на
// дашборде должно стоять фактическое время закрытия.
const consistent = topbar.includes('закрыта')
  ? /закрыта в \d\d:\d\d/.test(homeClosed)
  : !homeClosed.includes('закрыта')
say(
  75,
  consistent ? 'ОК' : 'НЕ ИСПРАВЛЕНО',
  `дашборд: «${homeClosed.split(' · ').slice(0, 2).join(' · ')}»; шапка: «${topbar.split('  ')[0]}»`,
)

/* 66: работа при закрытой смене */
await p.goto(FILE + '#/orders')
await p.waitForTimeout(600)
const createGone = (await p.getByRole('button', { name: 'Создать заказ' }).count()) === 0
await p.goto(FILE + '#/cash/deposit')
await p.waitForTimeout(600)
const depBlocked = await p.locator('.modal-foot').getByRole('button', { name: 'Внести' }).isDisabled()
say(66, createGone && depBlocked ? 'ОК' : 'НЕ ИСПРАВЛЕНО', `создание заказа скрыто: ${createGone}, внесение заблокировано: ${depBlocked}`)

await b.close()

console.log('\n=== Итог ===')
const byVerdict = {}
for (const r of results) byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1
for (const [k, v] of Object.entries(byVerdict)) console.log(`  ${k}: ${v}`)
const bad = results.filter((r) => r.verdict !== 'ОК')
if (bad.length) {
  console.log('\nТребует внимания:')
  for (const r of bad) console.log(`  № ${r.no} — ${r.verdict} — ${r.note}`)
}
console.log(errs.length ? '\nОШИБКИ СТРАНИЦЫ: ' + errs.join(' | ') : '\nОшибок страницы нет.')
