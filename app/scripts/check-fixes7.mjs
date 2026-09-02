/** Кириллица во вводе, столбец комментария, заказ без клиента,
 *  штучная продажа сразу в оплату. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { addTariff, setPostpay } from './lib-tariff.mjs'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(700)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)
await p.locator('.field-col', { hasText: 'Администратор' }).locator('select').selectOption('Смирнова Е. В.')
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(700)

/* ---------- 1. Только кириллица ---------- */
await p.goto(FILE + '#/clients/new')
await p.waitForTimeout(600)
const fio = p.locator('.modal-main .field-col', { hasText: 'ФИО родителя' }).locator('input')
await fio.click()
await fio.type('Ivanov Иванов')
ok('Латиница в ФИО не набирается', (await fio.inputValue()) === ' Иванов', `«${await fio.inputValue()}»`)

const note = p.locator('.modal-main .field-col', { hasText: 'Комментарий' }).locator('textarea')
await note.click()
await note.type('VIP клиент 5')
ok('Латиница в комментарии не набирается', (await note.inputValue()) === ' клиент 5', `«${await note.inputValue()}»`)

await p.goto(FILE + '#/directories/tariffs/new/Тариф')
await p.waitForTimeout(600)
const catName = p.locator('.modal-main .field-col', { hasText: 'Наименование' }).locator('input')
await catName.click()
await catName.type('SPA-зона 2')
ok('Латиница в справочнике не набирается', (await catName.inputValue()) === '-зона 2', `«${await catName.inputValue()}»`)

await p.goto(FILE + '#/settings/requisites')
await p.waitForTimeout(600)
const email = p.locator('.field-col', { hasText: 'Почта' }).locator('input')
await email.fill('')
await email.type('hello@aquaparty.ru')
ok('Почта остаётся латинской', (await email.inputValue()) === 'hello@aquaparty.ru', await email.inputValue())
const site = p.locator('.field-col', { hasText: 'Сайт' }).locator('input')
await site.fill('')
await site.type('aquaparty.ru')
ok('Сайт остаётся латинским', (await site.inputValue()) === 'aquaparty.ru', await site.inputValue())
const org = p.locator('.field-col', { hasText: 'Наименование' }).locator('input')
await org.fill('')
await org.type('ООО «Аква пати» LLC')
ok('В наименовании латиница отсечена', (await org.inputValue()) === 'ООО «Аква пати» ', `«${await org.inputValue()}»`)

/* ---------- 3 + 4. Штучная продажа без клиента ---------- */
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
await p.locator('.modal-main .subtabs').getByText('Товары').click()
await p.waitForTimeout(300)
const cap = p.locator('.cat-row', { hasText: 'Шапочка для плавания' })
await cap.getByRole('button', { name: 'Увеличить' }).click()
await p.waitForTimeout(300)

const createBtn = p.locator('.modal-foot').getByRole('button', { name: /Принять оплату|Создать заказ/ })
ok(
  'Штучный заказ: кнопка «Принять оплату»',
  (await createBtn.textContent()) === 'Принять оплату',
  await createBtn.textContent(),
)
ok(
  'Кнопка активна без выбора клиента',
  !(await createBtn.isDisabled()),
)
ok(
  'Подсказка объясняет, что оплатим сразу',
  (await p.locator('.modal-hint').textContent()).includes('сразу примем оплату'),
  await p.locator('.modal-hint').textContent(),
)

await createBtn.click()
await p.waitForTimeout(800)
ok(
  'Открылось окно оплаты',
  (await p.locator('.modal-title').textContent()).startsWith('Оплата заказа'),
  await p.locator('.modal-title').textContent(),
)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)

const row = (await p.locator('.tbl tbody tr').first().innerText()).replace(/\t/g, ' | ')
ok('Заказ закрыт сразу', row.includes('Закрыт'), row)
ok('Клиент — «Без клиента»', row.includes('Без клиента'), row)
ok('Тарифа нет', row.includes('Без тарифа'), row)

/* ---------- 2. Столбец «Комментарий» ---------- */
await addTariff(p, FILE)
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(600)
await p.locator('.cat-row', { hasText: 'Разовое посещение, 2 ч' }).getByRole('button', { name: 'Увеличить' }).click()
const commentBox = p.locator('.modal-main .field-col', { hasText: 'Комментарий к заказу' }).locator('textarea')
await commentBox.click()
await commentBox.type('Именинник, торт в 15:30')
await p.waitForTimeout(200)
await setPostpay(p)
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(800)

const head = (await p.locator('.tbl thead').innerText()).replace(/\s+/g, ' ')
ok('В списке заказов есть столбец «Комментарий»', head.includes('Комментарий'), head)
const withComment = await p.locator('.tbl tbody tr', { hasText: 'Именинник' }).count()
ok('Комментарий виден в строке заказа', withComment === 1, `строк: ${withComment}`)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
