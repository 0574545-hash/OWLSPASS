/** Пункты 31–40: жизненный цикл смены, приглашённые, формула остатка. */
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
const flat = async (sel) => (await p.locator(sel).innerText()).replace(/\s+/g, ' ')

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)

/* ---------- 37: приглашённый не входит ---------- */
for (const d of '2222') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)
ok(
  '37. Приглашённый по PIN не входит',
  (await p.locator('.pin-error').textContent())?.includes('не активирован'),
  await p.locator('.pin-error').textContent(),
)

for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(700)

/* ---------- 38: окно открытия смены не закрывается мимо ---------- */
ok('38. Крестика в окне открытия смены нет', (await p.locator('.modal-head .icon-btn').count()) === 0)
await p.locator('.modal-backdrop').click({ position: { x: 12, y: 12 } })
await p.waitForTimeout(400)
ok('38. Клик мимо окна его не закрывает', (await p.locator('.modal').count()) === 1)
await p.keyboard.press('Escape')
await p.waitForTimeout(400)
ok('38. Escape тоже не закрывает', (await p.locator('.modal').count()) === 1)

/* ---------- 35: остаток на начало ---------- */
const opening = F('Остаток на начало дня').locator('input')
ok('35. Остаток подставлен с прошлой смены', (await opening.inputValue()) === '0', await opening.inputValue())
await opening.fill('')
await opening.type('500')
await p.waitForTimeout(300)
ok(
  '35. Разница показана как расхождение',
  (await flat('.modal-aside')).includes('Расхождение на начало'),
  (await flat('.modal-aside')).slice(0, 130),
)
await opening.fill('')
await p.waitForTimeout(200)
await F('Администратор').locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(800)

/* ---------- 39: формула остатка ---------- */
await addTariff(p, FILE, { name: 'Час игры', min: 60, price: 1000 })
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(300)
for (const name of ['Шапочка для плавания', 'Очки для плавания']) {
  await p.locator('.cat-row', { hasText: name }).getByRole('button', { name: 'Увеличить' }).click()
}
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)
const due = await F('К оплате').locator('input').inputValue()
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(900)

await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(600)
await p.locator('.modal-foot').getByRole('button', { name: 'Вернуть в работу' }).click()
await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Оформить возврат' }).click()
await p.waitForTimeout(700)
await p.locator('.modal-main .tbl tbody tr', { hasText: 'Шапочка' }).locator('[role=checkbox]').click()
await p.waitForTimeout(300)
await p.locator('.modal-foot').getByRole('button', { name: 'Провести возврат' }).click()
await p.waitForTimeout(900)
const card = await flat('.modal-aside')
ok(
  '39. После возврата остаток 0, а не отрицательный долг',
  /Остаток 0/.test(card),
  card.slice(0, 150),
)
ok('39. Возврат показан отдельной строкой', card.includes('Возвращено'), `оплачено ${due}`)

// частичная оплата: возврат не должен уменьшать остаток второй раз
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(400)
await p.locator('.cat-row', { hasText: 'Купальник' }).getByRole('button', { name: 'Увеличить' }).click()
await p.waitForTimeout(600)
const card2 = await flat('.modal-aside')
ok(
  '39. Остаток = сумма заказа минус оплаченное',
  /Остаток 1 490/.test(card2),
  card2.slice(0, 170),
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(500)

/* ---------- 40: возврат в колонке «Сумма» ---------- */
const row = await flat('.tbl tbody tr:first-child')
ok('40. В списке заказов сумма учитывает возврат', row.includes('возврат'), row)

/* ---------- 31, 32: закрытая смена ---------- */
await p.goto(FILE + '#/cash/close')
await p.waitForTimeout(700)
await p.locator('.modal-foot').getByRole('button', { name: 'Закрыть смену' }).click()
await p.waitForTimeout(900)
await p.locator('.modal-foot').getByRole('button', { name: 'Готово' }).click()
await p.waitForTimeout(900)

await p.goto(FILE + '#/cash')
await p.waitForTimeout(700)
const cashButtons = (await p.locator('.page button').allInnerTexts()).map((t) => t.trim()).filter(Boolean)
ok('31. Кнопок «Внести», «Изъятие», «Закрыть смену» нет', !cashButtons.some((t) => /Внести|Изъятие|Закрыть смену/.test(t)), cashButtons.slice(0, 6).join(' | '))
ok(
  '31. Подпись говорит, что операции заблокированы',
  (await flat('.page .subtitle')).includes('заблокированы'),
  await flat('.page .subtitle'),
)

await p.goto(FILE + '#/cash/deposit')
await p.waitForTimeout(600)
const depositBtn = p.locator('.modal-foot').getByRole('button', { name: 'Внести' })
ok('31. Внесение заблокировано', await depositBtn.isDisabled())
ok(
  '31. И объясняет причину',
  (await depositBtn.getAttribute('title'))?.includes('Смена закрыта'),
  await depositBtn.getAttribute('title'),
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

await p.goto(FILE + '#/orders')
await p.waitForTimeout(600)
ok(
  '31. «Создать заказ» при закрытой смене нет',
  (await p.getByRole('button', { name: 'Создать заказ' }).count()) === 0,
)
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(600)
const payBtn = p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' })
ok('31. Оплата заказа заблокирована', await payBtn.isDisabled())
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

await p.goto(FILE + '#/cash/close')
await p.waitForTimeout(700)
const closeAgain = p.locator('.modal-foot').getByRole('button', { name: 'Закрыть смену' })
ok('32. Повторное закрытие смены заблокировано', await closeAgain.isDisabled())
ok(
  '32. И объясняет причину',
  (await closeAgain.getAttribute('title'))?.includes('уже закрыта'),
  await closeAgain.getAttribute('title'),
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* ---------- 33, 34, 36: смена как единый источник ---------- */
await p.goto(FILE + '#/cash/shifts')
await p.waitForTimeout(700)
const shifts = await flat('.tbl tbody')
ok('34. Закрытая смена одна и та же в истории', (shifts.match(/№ 218/g) ?? []).length === 1, shifts.slice(0, 140))
const stats = await flat('.page')
ok('36. Выручка за месяц не включает размен', !stats.includes('Выручка за месяц 0'), stats.slice(0, 120))

await p.goto(FILE + '#/')
await p.waitForTimeout(600)
ok(
  '33. Администратор и кассир — из записи смены',
  (await flat('.page .subtitle')).includes('администратор Смирнова Е. В., кассир Тарасов Д. О.'),
  await flat('.page .subtitle'),
)

/* ---------- 31: новая смена ---------- */
const newShift = p.getByRole('button', { name: 'Открыть новую смену' })
ok('31. В шапке есть «Открыть новую смену»', (await newShift.count()) === 1)
await newShift.click()
await p.waitForTimeout(800)
ok(
  '31. Открывается окно новой смены',
  (await p.locator('.modal-title').textContent()) === 'Открыть смену',
  await p.locator('.modal-title').textContent(),
)
const carried = F('Остаток на начало дня').locator('input')
ok(
  '35. В новой смене остаток — то, что оставила прошлая',
  (await carried.inputValue()) !== '0',
  await carried.inputValue(),
)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
