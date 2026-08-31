/** Проверяет замечания 7–12. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { addTariff } from './lib-tariff.mjs'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', e => errs.push(e.message))
p.on('dialog', d => d.accept())
const ok = (n, c, x='') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)
const txt = async s => (await p.locator(s).first().textContent())?.trim()

await p.goto(FILE, { waitUntil: 'load' }); await p.waitForTimeout(700)
for (const d of '1111') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(600)

// 7 — кассир по PIN, администратор пустой
const cashier = await p.locator('.field-col', { hasText: 'Кассир' }).locator('input').inputValue()
const adminSel = p.locator('.field-col', { hasText: 'Администратор' }).locator('select')
ok('7. Кассир подставлен по PIN', cashier === 'Смирнова Е. В.', cashier)
ok('7. Администратор пустой', (await adminSel.inputValue()) === '')
ok('7. «Открыть смену» ждёт администратора',
   await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).isDisabled())

await adminSel.selectOption('Смирнова Е. В.'); await p.waitForTimeout(200)
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(600)
// Тарифы заказчик заводит сам — создаём тот, на котором построен сценарий.
await addTariff(p, FILE)

// 8 — после открытия смены — заказы
ok('8. Переход на «Заказы»', p.url().includes('/orders'), p.url().split('#')[1])
ok('8. Пункт меню активен', (await p.locator('.sb-item.active').textContent())?.includes('Заказы'))

// 9 — «+» в поиске заказов заводит клиента
await p.locator('.search-wrap .search-plus').click(); await p.waitForTimeout(500)
ok('9. «+» открыл создание клиента', (await txt('.modal-title')) === 'Добавить клиента')
await p.locator('.modal-head .icon-btn').click(); await p.waitForTimeout(500)
ok('9. Закрытие вернуло на «Заказы»', p.url().includes('/orders'), p.url().split('#')[1])

// 11 — порог 3 символа
const box = p.locator('.search-wrap .input')
await box.fill('см'); await p.waitForTimeout(300)
ok('11. До 3 символов не ищет', (await txt('.tbl tbody tr'))?.includes('не менее 3'))

// Заводим заказ, чтобы проверить 10 и 12
await box.fill(''); await p.goto(FILE + '#/orders/new'); await p.waitForTimeout(500)
const f = p.locator('.field-plus .input')
await f.click(); await f.fill('см'); await p.waitForTimeout(250)
ok('11. Подсказки тоже с 3 символов',
   (await p.locator('.picker-empty').first().textContent())?.includes('не менее 3'))
await f.fill('Смирнова'); await p.waitForTimeout(250)
await p.locator('.picker-row').first().click(); await p.waitForTimeout(200)
// Дети попадают в заказ только когда их отметили — по ним и ищем (замечание 25).
await p.locator('.modal-main [role=checkbox]', { hasText: 'Мия' }).first().click(); await p.waitForTimeout(150)
await p.locator('.cat-row', { hasText: 'Разовое посещение, 2 ч' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.modal-foot').getByRole('button', { name: 'Создать заказ' }).click()
await p.waitForTimeout(600)
await p.locator('.tbl tbody tr').first().click(); await p.waitForTimeout(400)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click(); await p.waitForTimeout(400)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click(); await p.waitForTimeout(600)

// 10 — поиск по имени ребёнка
await p.goto(FILE + '#/orders'); await p.waitForTimeout(500)
await box.fill('Мия'); await p.waitForTimeout(350)
const n = await p.locator('.tbl tbody tr').count()
ok('10. Поиск по имени ребёнка', n === 1 && !(await txt('.tbl tbody tr'))?.includes('не найдено'))
// 12 — «Чек» открывает просмотр
await p.goto(FILE + '#/cash'); await p.waitForTimeout(500)
await p.locator('.tbl tbody tr').first().getByRole('button', { name: 'Чек' }).click()
await p.waitForTimeout(500)
ok('12. «Чек» открыл просмотр', (await txt('.modal-title'))?.startsWith('Чек по заказу'), await txt('.modal-title'))
ok('12. Степперов нет (не редактируется)', (await p.locator('.cat-row').count()) === 0)
ok('12. Комментарий заблокирован', await p.locator('.modal-main textarea').isDisabled())
ok('12. Состав заказа виден', (await p.locator('.modal-main .tbl tbody tr').count()) > 0)
ok('12. Есть «Печать»', (await p.locator('.modal-foot').getByRole('button', { name: 'Печать' }).count()) === 1)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
