/**
 * Clicks through the whole product in a real browser and captures a
 * screenshot of every screen. Run against `vite preview` on :4173.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? 'shots'
mkdirSync(OUT, { recursive: true })

// The environment ships Chromium already; the version pinned by the local
// playwright package is not downloaded.
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

let step = 0
const shot = async (name) => {
  step += 1
  await page.waitForTimeout(220)
  await page.screenshot({ path: `${OUT}/${String(step).padStart(2, '0')}-${name}.png` })
  console.log(`  ${String(step).padStart(2, '0')}  ${name}`)
}

const go = async (path) => {
  await page.goto(`http://localhost:4173${path}`, { waitUntil: 'networkidle' })
}

const text = async (sel) => (await page.locator(sel).first().textContent())?.trim()

console.log('\n=== Проход по продукту ===')

// 01 — PIN
await go('/')
await shot('01-vhod')
if (!(await page.getByText('Введите PIN').isVisible())) throw new Error('нет экрана входа')

// PIN 1111 = Смирнова Е. В., администратор
for (const d of '1111') await page.getByRole('button', { name: d, exact: true }).click()
await page.waitForTimeout(400)

// 02 — opening the shift
await shot('02-otkrytie-smeny')
if (!(await page.getByText('Открыть смену').first().isVisible())) throw new Error('нет окна открытия смены')
const startCash = await text('.card-total > span:last-child')
await page.getByRole('button', { name: 'Открыть смену' }).click()
await page.waitForTimeout(400)

// 03 — home
await shot('03-glavnaya')
const revenue = await text('.stat-value')

// 04 — orders
await page.getByRole('link', { name: /Заказы/ }).click()
await shot('04-zakazy')
const orderRows = await page.locator('.tbl tbody tr').count()

// 05 — create order
await go('/orders/new')
await shot('05-sozdat-zakaz')

// 06 — order card for 4810, the order the canvas threads through
await go('/orders/4810')
await shot('06-kartochka-zakaza')
const remainder = await text('.modal-aside .card-total > span:last-child')

// 07 — payment
await page.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await page.waitForTimeout(300)
await shot('07-oplata-zakaza')
const due = await text('.modal-aside .card-total > span:last-child')

// take the payment and confirm the order closes
await page.locator('.modal-foot').getByRole('button', { name: 'Принять оплату' }).click()
await page.waitForTimeout(500)
await shot('07b-posle-oplaty')
const paidRow = await page
  .locator('.tbl tbody tr', { hasText: '№ 4810' })
  .first()
  .textContent()

// 08 — refund on a paid order
await go('/orders/4806/refund')
await shot('08-vozvrat')

// 09 — clients
await go('/clients')
await shot('09-klienty')

// 10 — new client
await go('/clients/new')
await shot('10-dobavit-klienta')

// 11 — client card
await go('/clients/cl-kovaleva')
await shot('11-kartochka-klienta')

// 12 — cash journal
await go('/cash')
await shot('12-kassa')
const cashOnHand = await text('.stat-value')

// 13 / 14 — deposit and collection
await go('/cash/deposit')
await shot('13-vnesenie')
await go('/cash/collect')
await shot('14-inkassaciya')

// 15 — shifts
await go('/cash/shifts')
await shot('15-smeny')

// 19–22 — directories
await go('/directories')
await shot('19-spravochniki')
await go('/directories/services')
await shot('20-uslugi')
await go('/directories/goods')
await shot('21-tovary')
await go('/directories/discounts')
await shot('22-skidki')

// 23 — a catalog position
await go('/directories/item/tariff-2h')
await shot('23-poziciya-spravochnika')

// 30 — confirming a deletion
await go('/directories/item/tariff-2h/delete')
await shot('30-podtverzhdenie-udaleniya')

// 24–29 — settings
await go('/settings')
await shot('24-nastroyki')
await go('/settings/users/u-beketov')
await shot('25-polzovatel-i-prava')
await go('/settings/roles')
await shot('26-dolzhnosti')
await go('/settings/requisites')
await shot('27-rekvizity')
await go('/settings/payments')
await shot('28-kassa-i-oplata')
await go('/settings/notifications')
await shot('29-uvedomleniya')

// 18 — signing out
await go('/logout')
await shot('18-vyhod-iz-sistemy')

// 16 — closing the shift
await go('/cash/close')
await shot('16-zakrytie-smeny')

// 17 — report
await page.locator('.modal-foot').getByRole('button', { name: 'Закрыть смену' }).click()
await page.waitForTimeout(500)
await shot('17-otchet-po-smene')
const reportRevenue = await text('.modal-aside .card-total > span:last-child')

await browser.close()

console.log('\n=== Значения ===')
console.log(`  В кассе на старте          ${startCash}`)
console.log(`  Выручка за смену (Главная) ${revenue}`)
console.log(`  Строк в таблице заказов    ${orderRows}`)
console.log(`  Остаток по заказу 4810     ${remainder}`)
console.log(`  К оплате в окне оплаты     ${due}`)
console.log(`  Наличные в кассе           ${cashOnHand}`)
console.log(`  Выручка в отчёте           ${reportRevenue}`)
console.log(`  Строка 4810 после оплаты   ${paidRow?.replace(/\s+/g, ' ').trim()}`)

if (errors.length) {
  console.log(`\n!! Ошибки в консоли (${errors.length}):`)
  for (const e of errors.slice(0, 10)) console.log(`   ${e}`)
  process.exit(1)
}
console.log('\nОшибок в консоли нет.\n')
