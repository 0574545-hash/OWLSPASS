/** Тарифы заказчик заводит сам — в пустой сборке справочник тарифов пуст.
 *  Сценарии, которым нужен тариф, создают его этой функцией. */
export async function addTariff(p, FILE, { name = 'Разовое посещение, 2 ч', min = 120, price = 700 } = {}) {
  await p.goto(FILE + '#/directories/tariffs/new/Тариф')
  await p.waitForTimeout(600)
  await p.locator('.modal-main .field-col', { hasText: 'Наименование' }).locator('input').fill(name)
  await p.locator('.modal-main .field-col', { hasText: 'Длительность' }).locator('input').fill(String(min))
  await p.locator('.modal-main .field-col', { hasText: 'Цена' }).first().locator('input').fill(String(price))
  await p.locator('.modal-foot').getByRole('button', { name: 'Сохранить' }).click()
  await p.waitForTimeout(500)
}
