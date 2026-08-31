/** Продолжение: возвраты, бесплатный визит, лимиты, справочники, отчёт. */
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
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)
await F('Администратор').locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(800)

/* ---------- 11: потолок суммы ---------- */
await p.goto(FILE + '#/cash/deposit')
await p.waitForTimeout(600)
const amount = F('Сумма внесения').locator('input')
await amount.fill('')
await amount.type('999999999999')
await p.waitForTimeout(300)
ok('11. Сумма ограничена миллионом', (await amount.inputValue()) === '1 000 000', await amount.inputValue())
ok(
  '11. И объясняет предел',
  (await p.locator('.field-error').first().textContent())?.includes('1 000 000'),
  await p.locator('.field-error').first().textContent(),
)
await amount.fill('')
await amount.type('3000')
await F('Кто внёс').locator('select').selectOption({ index: 0 })
await p.locator('.modal-foot').getByRole('button', { name: 'Внести' }).click()
await p.waitForTimeout(800)

/* ---------- 17: кто передал и принял ---------- */
const journal = await flat('.tbl tbody')
ok('17. В журнале видно, кто передал и принял', journal.includes('→'), journal.slice(0, 160))

/* ---------- 22: подпись плитки ---------- */
const cashNote = await flat('.stat:first-child')
ok('22. Подпись «изъятий не было»', cashNote.includes('изъятий не было'), cashNote)

/* ---------- 29: «−0» в изъятии ---------- */
await p.goto(FILE + '#/cash/collect')
await p.waitForTimeout(600)
const sum = F('Сумма выемки').locator('input')
await sum.fill('')
await p.waitForTimeout(300)
ok('29. «−0» в изъятии нет', !(await flat('.modal-aside')).includes('−0'), await flat('.modal-aside'))
ok(
  '23. Выключенная кнопка объясняет себя',
  (await p.locator('.modal-foot').getByRole('button', { name: 'Провести выемку' }).getAttribute('title'))?.includes('сумму'),
  await p.locator('.modal-foot').getByRole('button', { name: 'Провести выемку' }).getAttribute('title'),
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(400)

/* ---------- 15: «На согласовании» не продаётся ---------- */
await addTariff(p, FILE, { name: 'Час игры', min: 60, price: 1000 })
await p.goto(FILE + '#/directories/services')
await p.waitForTimeout(600)
const pending = await p.locator('.tbl tbody tr', { hasText: 'На согласовании' }).count()
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
const offered = await p.locator('.cat-row').allInnerTexts()
ok(
  '15. Позиции «На согласовании» в заказ не попадают',
  !offered.some((t) => t.includes('Пираты')),
  `в справочнике на согласовании: ${pending}`,
)

/* ---------- 4: бесплатный визит ---------- */
await p.locator('.cat-row', { hasText: 'Час игры' }).getByRole('button', { name: 'Увеличить' }).click()
await F('Разовая скидка').locator('input').fill('1000')
await p.waitForTimeout(300)
ok('3. Разовая скидка не больше суммы', (await F('Разовая скидка').locator('input').inputValue()) === '1 000')
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(800)
await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(600)
const closeBtn = p.locator('.modal-foot').getByRole('button', { name: 'Закрыть заказ' })
ok('4. Нулевой заказ без основания не закрыть', await closeBtn.isDisabled())
ok(
  '4. Кнопка объясняет, чего не хватает',
  (await closeBtn.getAttribute('title'))?.includes('основание'),
  await closeBtn.getAttribute('title'),
)
await F('Основание бесплатного визита').locator('select').selectOption('Бесплатное посещение')
await p.waitForTimeout(300)
ok('4. С основанием закрыть можно', !(await closeBtn.isDisabled()))
await closeBtn.click()
await p.waitForTimeout(800)

await p.goto(FILE + '#/cash')
await p.waitForTimeout(600)
const j2 = await flat('.tbl tbody')
ok('4. Бесплатный визит попал в журнал кассы', j2.includes('Бесплатно'), j2.slice(0, 200))

/* ---------- 5, 7, 8: возврат ---------- */
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(300)
await p.locator('.cat-row', { hasText: 'Шапочка для плавания' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.cat-row', { hasText: 'Очки для плавания' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)
await p.locator('.modal-main .pill-btn').filter({ hasText: 'Карта' }).first().click()
await p.waitForTimeout(300)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)

await p.locator('.tbl tbody tr').first().click()
await p.waitForTimeout(600)
await p.locator('.modal-foot').getByRole('button', { name: 'Вернуть в работу' }).click()
await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Оформить возврат' }).click()
await p.waitForTimeout(700)
ok(
  '8. Способ возврата подставлен по оплате',
  (await F('Способ возврата').locator('select').inputValue()) === 'Карта',
  await F('Способ возврата').locator('select').inputValue(),
)
await F('Способ возврата').locator('select').selectOption('Наличные')
await p.waitForTimeout(300)
const refundBtn = p.locator('.modal-foot').getByRole('button', { name: 'Провести возврат' })
ok('8. Другой способ блокируется', await refundBtn.isDisabled())
ok(
  '8. И объясняет почему',
  (await refundBtn.getAttribute('title'))?.includes('Карта'),
  await refundBtn.getAttribute('title'),
)
await F('Способ возврата').locator('select').selectOption('Карта')
await p.waitForTimeout(300)
await p.locator('.modal-main .tbl tbody tr', { hasText: 'Шапочка' }).locator('[role=checkbox]').click()
await p.waitForTimeout(300)
ok('8. Тем же способом — можно', !(await refundBtn.isDisabled()))
await refundBtn.click()
await p.waitForTimeout(900)
// После возврата открывается карточка того же заказа.
const card = await flat('.modal-aside')
ok('5. Позиции пересчитаны без возвращённой', /Позиции · 1/.test(card), card.slice(0, 120))
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(400)
ok(
  '5. Возврат виден в составе заказа',
  (await flat('.modal-main')).includes('возвращено 1 из 1'),
  (await flat('.cat-row:first-child')).slice(0, 90),
)
await p.locator('.modal-head .icon-btn').click()
await p.waitForTimeout(500)
const row = await flat('.tbl tbody tr:first-child')
ok('7. В списке сумма с учётом возврата и признак', row.includes('возврат'), row)

/* ---------- 16, 25: справочник ---------- */
await p.goto(FILE + '#/directories/goods')
await p.waitForTimeout(600)
await p.locator('.tbl tbody tr', { hasText: 'Шапочка для плавания' }).first().click()
await p.waitForTimeout(700)
ok(
  '16. Использованную позицию не удаляют, а скрывают',
  (await p.locator('.modal-foot').getByRole('button', { name: 'Скрыть' }).count()) === 1,
  (await flat('.modal-foot')).slice(0, 80),
)
await p.locator('.modal-main .field-col', { hasText: 'Наименование' }).locator('input').fill('')
await p.waitForTimeout(300)
ok(
  '25. Заголовок при правке не подменяется',
  (await p.locator('.modal-title').textContent()) === 'Редактирование позиции',
  await p.locator('.modal-title').textContent(),
)

/* ---------- 19, 20: главная и визиты ---------- */
await p.goto(FILE + '#/')
await p.waitForTimeout(600)
const home = await flat('.page')
ok('19. Выручка считается по оплатам, а не по всем операциям', /\d+ оплат/.test(home), home.slice(0, 160))

await p.goto(FILE + '#/clients')
await p.waitForTimeout(600)
ok(
  '20. У клиента без заказов визитов нет',
  (await flat('.tbl tbody')).includes('—'),
  (await flat('.tbl tbody')).slice(0, 160),
)

/* ---------- 21, 30: закрытие смены ---------- */
await p.goto(FILE + '#/cash/close')
await p.waitForTimeout(700)
const counted = F('Фактически').locator('input')
if ((await counted.count()) > 0) await counted.fill('2 500')
await p.waitForTimeout(300)
await p.locator('.modal-foot').getByRole('button').last().click()
await p.waitForTimeout(900)
const report = await flat('.modal-aside')
ok('21. В отчёте есть фактическая сумма', report.includes('Фактически в кассе'), report.slice(0, 200))
await p.locator('.modal-foot').getByRole('button', { name: 'Готово' }).click()
await p.waitForTimeout(900)
ok(
  '30. После отчёта остаёмся в системе',
  (await p.locator('.sb').count()) === 1,
  p.url().split('#')[1] ?? '',
)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
