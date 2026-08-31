/** Права доступа: справочник, набор в должности и реальное ограничение. */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
const FILE = 'file://' + resolve('Аква пати — CRM (пустая касса).html')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (n, c, x = '') => console.log(`  ${c ? 'ok  ' : 'ПЛОХО'} ${n}${x ? '  — ' + x : ''}`)

/** Свежая вкладка: у каждой роли своя сессия. */
async function signIn(pin) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(FILE, { waitUntil: 'load' })
  await p.waitForTimeout(700)
  for (const d of pin) await p.getByRole('button', { name: d, exact: true }).click()
  await p.waitForTimeout(600)
  const admin = p.locator('.field-col', { hasText: 'Администратор' }).locator('select')
  if ((await admin.count()) > 0) {
    await admin.selectOption('Смирнова Е. В.')
    await p.locator('.modal-foot').getByRole('button', { name: 'Открыть смену' }).click()
    await p.waitForTimeout(800)
  }
  return p
}

const nav = async (p) => (await p.locator('.sb-item').allInnerTexts()).map((t) => t.split('\n')[0].trim())

/* ---------- Управляющий: всё ---------- */
console.log('\n=== Управляющий (PIN 4444) ===')
const boss = await signIn('4444')
const bossNav = await nav(boss)
ok('Видит все разделы', ['Заказы', 'Клиенты', 'Касса', 'Справочники', 'Настройки'].every((l) => bossNav.some((n) => n.startsWith(l))), bossNav.join(' | '))

/* ---------- Справочник «Права доступа» ---------- */
await boss.goto(FILE + '#/directories/permissions')
await boss.waitForTimeout(700)
const rows = await boss.locator('.tbl tbody tr').count()
ok('Справочник «Права доступа» открывается', rows >= 30, `строк: ${rows}`)
const head = (await boss.locator('.tbl thead').innerText()).replace(/\s+/g, ' ')
ok('Колонки: раздел, право, что открывает, у кого', head.includes('Раздел') && head.includes('Что открывает') && head.includes('должностей'), head)
const firstRow = (await boss.locator('.tbl tbody tr').first().innerText()).replace(/\s+/g, ' ')
ok('В строке видно, каким должностям право дано', firstRow.includes('Управляющий'), firstRow)

/* ---------- Должность набирается из перечня ---------- */
await boss.goto(FILE + '#/settings/roles')
await boss.waitForTimeout(600)
const rolesTable = (await boss.locator('.tbl').innerText()).replace(/\t/g, ' ')
ok('В таблице должностей счётчик прав', /\d+ из \d+/.test(rolesTable), rolesTable.split('\n')[1] ?? '')

await boss.locator('.tbl tbody tr', { hasText: 'Кассир' }).getByRole('button', { name: 'Изменить' }).click()
await boss.waitForTimeout(700)
const boxes = await boss.locator('.modal-main [role=checkbox]').count()
ok('В должности полный перечень прав галочками', boxes >= 30, `галочек: ${boxes}`)
const checked = await boss.locator('.modal-main [role=checkbox][aria-checked=true]').count()
ok('У кассира отмечена только часть', checked > 0 && checked < boxes, `${checked} из ${boxes}`)

// даём кассиру право «Создание заказа»
const createBox = boss.locator('.modal-main [role=checkbox]', { hasText: 'Создание заказа' }).first()
await createBox.click()
await boss.waitForTimeout(200)
await boss.locator('.modal-foot').getByRole('button', { name: 'Сохранить' }).click()
await boss.waitForTimeout(700)
ok(
  'Право добавилось к должности',
  (await boss.locator('.tbl tbody tr', { hasText: 'Кассир' }).innerText()).includes(String(checked + 1)),
  (await boss.locator('.tbl tbody tr', { hasText: 'Кассир' }).innerText()).replace(/\t/g, ' '),
)

/* ---------- Кассир: ограничен ---------- */
console.log('\n=== Кассир (PIN 3333) ===')
const cashier = await signIn('3333')
const cashierNav = await nav(cashier)
ok('Нет «Настроек» в меню', !cashierNav.some((n) => n.startsWith('Настройки')), cashierNav.join(' | '))
ok('Есть «Заказы» и «Касса»', cashierNav.some((n) => n.startsWith('Заказы')) && cashierNav.some((n) => n.startsWith('Касса')))

await cashier.goto(FILE + '#/settings')
await cashier.waitForTimeout(700)
ok(
  'Адрес настроек перебрасывает на доступный раздел',
  !cashier.url().includes('/settings'),
  cashier.url().split('#')[1],
)

await cashier.goto(FILE + '#/cash')
await cashier.waitForTimeout(600)
const cashButtons = await cashier.locator('.page button').allInnerTexts()
ok('Нет «Внести» и «Изъятие»', !cashButtons.some((t) => /Внести|Изъятие/.test(t)), cashButtons.map((t) => t.trim()).filter(Boolean).slice(0, 6).join(' | '))
ok('Нет «Закрыть смену»', !cashButtons.some((t) => /Закрыть смену/.test(t)))

await cashier.goto(FILE + '#/cash/collect')
await cashier.waitForTimeout(600)
ok('Окно изъятия не открывается', (await cashier.locator('.modal').count()) === 0, cashier.url().split('#')[1])

await cashier.goto(FILE + '#/')
await cashier.waitForTimeout(600)
ok(
  'Выручка за смену скрыта',
  !(await cashier.locator('.page').innerText()).includes('Выручка за смену'),
  (await cashier.locator('.stat-label').allInnerTexts()).join(' | '),
)

/* ---------- Администратор: без настроек ---------- */
console.log('\n=== Администратор (PIN 1111) ===')
const admin = await signIn('1111')
const adminNav = await nav(admin)
ok('Нет «Настроек»', !adminNav.some((n) => n.startsWith('Настройки')), adminNav.join(' | '))
ok('Справочники доступны', adminNav.some((n) => n.startsWith('Справочники')))
await admin.goto(FILE + '#/directories/tariffs')
await admin.waitForTimeout(600)
ok(
  'Может заводить тарифы',
  (await admin.getByRole('button', { name: 'Добавить тариф' }).count()) === 1,
)

await b.close()
console.log(errs.length ? '\nОШИБКИ: ' + errs.join(' | ') : '\nОшибок нет.')
