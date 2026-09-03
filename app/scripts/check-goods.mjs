/** Заказ без временных позиций закрывается сразу после оплаты — даже если
 *  позиция дорогая услуга в штуках. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM.html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('dialog', (d) => d.accept())
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)
const F = (l) => p.locator('.modal-main .field-col', { hasText: l }).first()
const flat = async (sel) => (await p.locator(sel).first().innerText()).replace(/\s+/g, ' ')

await p.goto(FILE, { waitUntil: 'load' })
await p.waitForTimeout(800)
for (const d of '4444') await p.getByRole('button', { name: d, exact: true }).click()
await p.waitForTimeout(700)
await F('Администратор').locator('select').selectOption({ index: 1 })
await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
await p.waitForTimeout(900)

/* ---------- праздничная программа: 1 шт. за 12 500 ---------- */
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(700)
await p.locator('.cat-row', { hasText: 'Праздничная программа «Морская»' }).getByRole('button', { name: 'Увеличить' }).click()
await p.waitForTimeout(300)
const foot = await flat('.modal-foot')
ok('Окно предупреждает: оплатим и закроем', /сразу примем оплату и закроем заказ/.test(foot), foot)
ok('Кнопка ведёт сразу к оплате', (await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).count()) === 1,
  await flat('.modal-foot'))
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(900)

const row = await flat('.tbl tbody tr:first-child')
ok('Заказ закрыт сразу после оплаты', row.includes('Закрыт'), row.slice(0, 150))
ok('Сумма 12 500 на месте', row.includes('12 500'), row.slice(0, 150))
ok('И тарифа у него нет', row.includes('Без тарифа'), row.slice(0, 150))

/* ---------- та же услуга вместе с временным тарифом ---------- */
await p.goto(FILE + '#/orders/new')
await p.waitForTimeout(700)
await p.locator('.cat-row', { hasText: 'Праздничная программа «Морская»' }).getByRole('button', { name: 'Увеличить' }).click()
await p.locator('.cat-row', { hasText: 'Разовое посещение, 2 ч' }).getByRole('button', { name: 'Увеличить' }).click()
await p.waitForTimeout(300)
ok('С временной позицией тариф появляется', !/Без тарифа/.test(await flat('.modal-aside')), (await flat('.modal-aside')).slice(0, 120))
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(800)
await p.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await p.waitForTimeout(900)
const row2 = await flat('.tbl tbody tr:first-child')
ok('Заказ с тарифом остаётся открытым', row2.includes('Открыт'), row2.slice(0, 150))

/* ---------- справочник: у «шт.» не пишем цену за минуты ---------- */
await p.goto(FILE + '#/directories/services')
await p.waitForTimeout(700)
await p.locator('.tbl tbody tr', { hasText: 'Праздничная программа «Морская»' }).first().click()
await p.waitForTimeout(700)
ok('В карточке «шт.» цена не за минуты', (await flat('.modal-aside')).includes('Цена за шт.'), (await flat('.modal-aside')).slice(0, 160))

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
