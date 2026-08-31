/** ============================================================
 *  Права доступа — справочник и проверка.
 *
 *  Один список на всё приложение: он показывается в справочнике
 *  «Права доступа», из него набирается должность, и по нему же
 *  экраны решают, что показать и что заблокировать.
 *  ============================================================ */

export type PermissionSection =
  | 'Смена'
  | 'Главная'
  | 'Заказы'
  | 'Клиенты'
  | 'Касса'
  | 'Справочники'
  | 'Настройки'

export interface Permission {
  id: string
  section: PermissionSection
  label: string
  /** Что именно открывает — колонка справочника. */
  opens: string
  /** Опасные права: их выделяем в списке. */
  risky?: boolean
}

export const PERMISSIONS: Permission[] = [
  // ---- Смена ----
  { id: 'shift.open', section: 'Смена', label: 'Открытие смены', opens: 'Окно открытия, ввод остатка на начало' },
  { id: 'shift.close', section: 'Смена', label: 'Закрытие смены', opens: 'Пересчёт кассы и объяснение расхождения' },
  { id: 'shift.report', section: 'Смена', label: 'Отчёт по смене', opens: 'Итоговый отчёт после закрытия' },

  // ---- Главная ----
  { id: 'home.revenue', section: 'Главная', label: 'Выручка за смену', opens: 'Плитка с деньгами на главной' },

  // ---- Заказы ----
  { id: 'orders.view', section: 'Заказы', label: 'Просмотр заказов', opens: 'Раздел «Заказы», список и карточка' },
  { id: 'orders.create', section: 'Заказы', label: 'Создание заказа', opens: 'Кнопка «Создать заказ»' },
  { id: 'orders.edit', section: 'Заказы', label: 'Изменение состава', opens: 'Плюс и минус позиций в открытом заказе' },
  { id: 'orders.discount', section: 'Заказы', label: 'Разовая скидка', opens: 'Поле «Разовая скидка» в заказе' },
  { id: 'orders.pay', section: 'Заказы', label: 'Приём оплаты', opens: 'Окно оплаты и выбор способа' },
  { id: 'orders.close', section: 'Заказы', label: 'Закрытие заказа', opens: 'Кнопка «Закрыть заказ»' },
  { id: 'orders.refund', section: 'Заказы', label: 'Возврат', opens: 'Оформление возврата по заказу', risky: true },
  { id: 'orders.comment', section: 'Заказы', label: 'Комментарий к заказу', opens: 'Правка комментария' },
  { id: 'orders.print', section: 'Заказы', label: 'Печать чека', opens: 'Кнопка «Печать» в просмотре заказа' },

  // ---- Клиенты ----
  { id: 'clients.view', section: 'Клиенты', label: 'Просмотр клиентов', opens: 'Раздел «Клиенты», список и карточка' },
  { id: 'clients.create', section: 'Клиенты', label: 'Создание клиента', opens: 'Кнопки «+» и «Добавить клиента»' },
  { id: 'clients.edit', section: 'Клиенты', label: 'Правка карточки', opens: 'ФИО, телефон, дети, комментарий' },
  { id: 'clients.discount', section: 'Клиенты', label: 'Постоянная скидка', opens: 'Основание и процент скидки клиента' },
  { id: 'clients.file', section: 'Клиенты', label: 'Загрузка файла', opens: 'Документ-основание скидки' },
  { id: 'clients.debt', section: 'Клиенты', label: 'Просмотр задолженности', opens: 'Долг клиента в карточке и списке' },

  // ---- Касса ----
  { id: 'cash.view', section: 'Касса', label: 'Просмотр журнала', opens: 'Раздел «Касса», вкладка «Операции»' },
  { id: 'cash.deposit', section: 'Касса', label: 'Внесение', opens: 'Окно внесения денег в кассу' },
  { id: 'cash.collect', section: 'Касса', label: 'Изъятие', opens: 'Окно изъятия из кассы', risky: true },
  { id: 'cash.shifts', section: 'Касса', label: 'История смен', opens: 'Вкладка «Смены» и чужие смены' },
  { id: 'cash.receipt', section: 'Касса', label: 'Чек и акт по операции', opens: 'Просмотр заказа из журнала кассы' },

  // ---- Справочники ----
  { id: 'catalog.view', section: 'Справочники', label: 'Просмотр справочников', opens: 'Раздел «Справочники» целиком' },
  { id: 'catalog.edit', section: 'Справочники', label: 'Правка позиций', opens: 'Создание и изменение тарифов, услуг, товаров' },
  { id: 'catalog.delete', section: 'Справочники', label: 'Удаление позиции', opens: 'Кнопка «Удалить» в карточке позиции', risky: true },
  { id: 'catalog.discounts', section: 'Справочники', label: 'Правка оснований скидок', opens: 'Вкладка «Скидки»' },
  { id: 'catalog.export', section: 'Справочники', label: 'Выгрузка CSV', opens: 'Кнопка «Выгрузить»' },

  // ---- Настройки ----
  { id: 'settings.view', section: 'Настройки', label: 'Просмотр настроек', opens: 'Раздел «Настройки» целиком' },
  { id: 'settings.usersView', section: 'Настройки', label: 'Пользователи: просмотр', opens: 'Список сотрудников' },
  { id: 'settings.usersEdit', section: 'Настройки', label: 'Пользователи: правка', opens: 'Создание, ФИО, телефон, смена' },
  { id: 'settings.usersAccess', section: 'Настройки', label: 'Пользователи: должность и PIN', opens: 'Смена должности, PIN, отключение сотрудника', risky: true },
  { id: 'settings.roles', section: 'Настройки', label: 'Должности', opens: 'Создание и правка должностей с правами', risky: true },
  { id: 'settings.requisites', section: 'Настройки', label: 'Реквизиты', opens: 'ИНН, адреса, контакты, режим работы' },
  { id: 'settings.payments', section: 'Настройки', label: 'Касса и оплата', opens: 'Способы оплаты, основания и причины' },
  { id: 'settings.notifications', section: 'Настройки', label: 'Уведомления', opens: 'Включение сценариев SMS' },
  { id: 'settings.reset', section: 'Настройки', label: 'Обнуление кассы и заказов', opens: 'Полная очистка заказов и операций', risky: true },
]

export const PERMISSION_SECTIONS: PermissionSection[] = [
  'Смена',
  'Главная',
  'Заказы',
  'Клиенты',
  'Касса',
  'Справочники',
  'Настройки',
]

export const ALL_PERMISSION_IDS = PERMISSIONS.map((p) => p.id)

export function permissionsOfSection(section: PermissionSection): Permission[] {
  return PERMISSIONS.filter((p) => p.section === section)
}

export function permissionLabel(id: string): string {
  return PERMISSIONS.find((p) => p.id === id)?.label ?? id
}

/** Набор прав должности «Администратор» — всё, кроме настроек, удаления
 *  и изъятия из кассы. Стартовые наборы живут в seed. */
export function without(ids: string[], ...remove: string[]): string[] {
  return ids.filter((id) => !remove.includes(id))
}
