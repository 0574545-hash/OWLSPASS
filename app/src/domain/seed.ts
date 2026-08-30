import type {
  CashOp,
  CatalogItem,
  Client,
  DiscountGround,
  NotificationRule,
  Order,
  OrderItem,
  PaymentMethod,
  PaymentSettings,
  Requisites,
  Role,
  Shift,
  User,
} from './types'
import { orderTotals } from './rules'

const t = (h: number, m: number) => h * 60 + m

/* ============================================================
   Catalog — «Справочники». Counts are derived, never typed.
   ============================================================ */

export const CATALOG: CatalogItem[] = [
  // ---- Тарифы ----
  {
    id: 'tariff-2h',
    name: 'Разовое посещение, 2 ч',
    category: 'Тариф',
    unit: 'чел.',
    price: 700,
    durationMin: 120,
    status: 'active',
    usedInOrders: 214,
    changedAt: '12.06.2026',
  },
  {
    id: 'tariff-1h',
    name: 'Разовое посещение, 1 ч',
    category: 'Тариф',
    unit: 'чел.',
    price: 450,
    durationMin: 60,
    status: 'active',
    usedInOrders: 86,
    changedAt: '12.06.2026',
  },
  {
    id: 'tariff-overtime',
    name: 'Доплата за час сверх тарифа',
    category: 'Тариф',
    unit: 'час',
    price: 350,
    durationMin: 60,
    status: 'active',
    usedInOrders: 41,
    changedAt: '12.06.2026',
  },

  // ---- Услуги ----
  {
    id: 'svc-morskaya',
    name: 'Праздничная программа «Морская»',
    category: 'Услуга',
    unit: 'шт.',
    price: 12500,
    durationMin: 180,
    status: 'active',
    group: 'Праздники',
    performer: 'Администратор',
    usedInOrders: 63,
    changedAt: '02.07.2026',
  },
  {
    id: 'svc-piraty',
    name: 'Праздничная программа «Пираты»',
    category: 'Услуга',
    unit: 'шт.',
    price: 14200,
    durationMin: 180,
    status: 'pending',
    group: 'Праздники',
    performer: 'Администратор',
    usedInOrders: 12,
    changedAt: '21.08.2026',
  },
  {
    id: 'svc-aquagrim',
    name: 'Аквагрим',
    category: 'Услуга',
    unit: 'чел.',
    price: 450,
    status: 'active',
    group: 'Развлечения',
    performer: 'Персонал',
    usedInOrders: 178,
    changedAt: '12.06.2026',
  },
  {
    id: 'svc-bubbles',
    name: 'Шоу мыльных пузырей',
    category: 'Услуга',
    unit: 'шт.',
    price: 3500,
    status: 'active',
    group: 'Развлечения',
    performer: 'Подрядчик',
    usedInOrders: 34,
    changedAt: '12.06.2026',
  },
  {
    id: 'svc-photo',
    name: 'Фотосъёмка праздника',
    category: 'Услуга',
    unit: 'час',
    price: 3200,
    durationMin: 60,
    status: 'hidden',
    group: 'Съёмка',
    performer: 'Подрядчик',
    usedInOrders: 19,
    changedAt: '04.08.2026',
  },
  {
    id: 'svc-hall',
    name: 'Аренда зала под праздник',
    category: 'Услуга',
    unit: 'час',
    price: 4000,
    durationMin: 60,
    status: 'active',
    group: 'Аренда',
    performer: 'Администратор',
    usedInOrders: 51,
    changedAt: '12.06.2026',
  },
  {
    id: 'svc-balloons',
    name: 'Оформление шарами',
    category: 'Услуга',
    unit: 'шт.',
    price: 1800,
    status: 'active',
    group: 'Декор',
    performer: 'Подрядчик',
    usedInOrders: 27,
    changedAt: '12.06.2026',
  },
  {
    id: 'svc-cleaning',
    name: 'Экспресс-уборка после праздника',
    category: 'Услуга',
    unit: 'шт.',
    price: 1200,
    status: 'active',
    group: 'Сервис',
    performer: 'Персонал',
    usedInOrders: 44,
    changedAt: '12.06.2026',
  },
  {
    id: 'svc-invites',
    name: 'Приглашения, набор 10 шт.',
    category: 'Услуга',
    unit: 'набор',
    price: 600,
    status: 'active',
    group: 'Декор',
    performer: 'Администратор',
    usedInOrders: 15,
    changedAt: '12.06.2026',
  },
  {
    id: 'svc-video',
    name: 'Видеопоздравление на экране',
    category: 'Услуга',
    unit: 'шт.',
    price: 1500,
    status: 'hidden',
    group: 'Услуга',
    performer: 'Администратор',
    usedInOrders: 6,
    changedAt: '17.08.2026',
  },

  // ---- Товары ----
  { id: 'gd-socks', name: 'Носочки-нескользяшки', category: 'Товар', unit: 'пара', price: 250, status: 'active', group: 'Экипировка', usedInOrders: 302, changedAt: '12.06.2026' },
  { id: 'gd-swimsuit', name: 'Купальник детский, 2—8 лет', category: 'Товар', unit: 'шт.', price: 1490, status: 'active', group: 'Экипировка', usedInOrders: 48, changedAt: '12.06.2026' },
  { id: 'gd-cap', name: 'Шапочка для плавания', category: 'Товар', unit: 'шт.', price: 420, status: 'active', group: 'Экипировка', usedInOrders: 121, changedAt: '12.06.2026' },
  { id: 'gd-ring', name: 'Плавательный круг «Кит»', category: 'Товар', unit: 'шт.', price: 890, status: 'hidden', group: 'Игрушки', usedInOrders: 22, changedAt: '09.08.2026' },
  { id: 'gd-armbands', name: 'Нарукавники, пара', category: 'Товар', unit: 'пара', price: 360, status: 'hidden', group: 'Игрушки', usedInOrders: 31, changedAt: '09.08.2026' },
  { id: 'gd-towel', name: 'Полотенце с логотипом', category: 'Товар', unit: 'шт.', price: 1100, status: 'active', group: 'Мерч', usedInOrders: 64, changedAt: '12.06.2026' },
  { id: 'gd-tshirt', name: 'Футболка «Аква пати», детская', category: 'Товар', unit: 'шт.', price: 990, status: 'active', group: 'Мерч', usedInOrders: 39, changedAt: '12.06.2026' },
  { id: 'gd-bag', name: 'Сумка для мокрых вещей', category: 'Товар', unit: 'шт.', price: 490, status: 'active', group: 'Мерч', usedInOrders: 87, changedAt: '12.06.2026' },
  { id: 'gd-goggles', name: 'Очки для плавания', category: 'Товар', unit: 'шт.', price: 640, status: 'active', group: 'Экипировка', usedInOrders: 73, changedAt: '12.06.2026' },
  { id: 'gd-fish', name: 'Игрушка для воды «Рыбки»', category: 'Товар', unit: 'набор', price: 450, status: 'hidden', group: 'Игрушки', usedInOrders: 18, changedAt: '09.08.2026' },
  { id: 'gd-robe', name: 'Халат детский', category: 'Товар', unit: 'шт.', price: 1790, status: 'active', group: 'Экипировка', usedInOrders: 26, changedAt: '12.06.2026' },
  { id: 'gd-cert3', name: 'Подарочный сертификат, 3 000', category: 'Товар', unit: 'шт.', price: 3000, status: 'active', group: 'Сертификаты', usedInOrders: 17, changedAt: '12.06.2026' },
  { id: 'gd-cert5', name: 'Подарочный сертификат, 5 000', category: 'Товар', unit: 'шт.', price: 5000, status: 'active', group: 'Сертификаты', usedInOrders: 9, changedAt: '12.06.2026' },
  { id: 'gd-scrunchie', name: 'Резинка для волос, набор', category: 'Товар', unit: 'набор', price: 180, status: 'active', group: 'Мерч', usedInOrders: 141, changedAt: '12.06.2026' },
  { id: 'gd-bottle', name: 'Бутылка для воды 500 мл', category: 'Товар', unit: 'шт.', price: 590, status: 'active', group: 'Мерч', usedInOrders: 55, changedAt: '12.06.2026' },
  { id: 'gd-raincoat', name: 'Дождевик детский', category: 'Товар', unit: 'шт.', price: 750, status: 'hidden', group: 'Экипировка', usedInOrders: 11, changedAt: '09.08.2026' },

  // ---- Скидки ----
  { id: 'disc-many', name: 'Скидка «Многодетная семья»', category: 'Скидка', unit: '%', price: 15, status: 'active', usedInOrders: 96, changedAt: '12.06.2026' },
  { id: 'disc-svo', name: 'Скидка «СВО»', category: 'Скидка', unit: '%', price: 20, status: 'active', usedInOrders: 34, changedAt: '12.06.2026' },
  { id: 'disc-inv', name: 'Скидка «Инвалид»', category: 'Скидка', unit: '%', price: 50, status: 'active', usedInOrders: 12, changedAt: '12.06.2026' },
  { id: 'disc-manual', name: 'Скидка «Ручная»', category: 'Скидка', unit: '%', price: 0, status: 'active', usedInOrders: 58, changedAt: '12.06.2026' },
]

const price = (id: string) => CATALOG.find((c) => c.id === id)!.price

/** Duration of the tariff/service that governs an order's окончание. */
export function tariffDuration(itemId: string): number {
  return CATALOG.find((c) => c.id === itemId)?.durationMin ?? 120
}

export const DISCOUNT_GROUNDS: DiscountGround[] = [
  { id: 'dg-many', name: 'Многодетная семья', percent: 15, appliesTo: 'Все посещения', term: 'Постоянная', proof: 'Удостоверение', active: true },
  { id: 'dg-svo', name: 'СВО', percent: 20, appliesTo: 'Все посещения', term: 'Постоянная', proof: 'Справка', active: true },
  { id: 'dg-inv', name: 'Инвалид', percent: 50, appliesTo: 'Весь заказ', term: 'Постоянная', proof: 'Справка', active: true },
  { id: 'dg-manual', name: 'Ручная', percent: null, appliesTo: 'Один заказ', term: 'Разово', proof: 'Решение администратора', active: true },
]

/* ============================================================
   Clients
   ============================================================ */

interface ClientSeed {
  id: string
  fullName: string
  phone: string
  birthDate: string
  discountPct: number
  discountGround: string
  children: [string, string][]
  lastVisit: string
  seededBalance: number
  since: string
  visits: number
  ordersTotal: number
  comment?: string
  file?: { name: string; size: string }
  discountUntil?: string
}

const CLIENT_SEEDS: ClientSeed[] = [
  { id: 'cl-smirnova', fullName: 'Смирнова Анна Игоревна', phone: '9214481206', birthDate: '08.11.1989', discountPct: 10, discountGround: 'Многодетная семья', children: [['Мия', '14.06.2021'], ['Лев', '03.02.2018']], lastVisit: '18.08.2026', seededBalance: 1200, since: '19.03.2023', visits: 12, ordersTotal: 28400, comment: 'Постоянный клиент, всегда просит столик у окна.', discountUntil: '31.12.2026' },
  { id: 'cl-kovaleva', fullName: 'Ковалёва Дарья Сергеевна', phone: '9160347719', birthDate: '14.03.1991', discountPct: 15, discountGround: 'Многодетная семья', children: [['Ева', '02.05.2020'], ['Марк', '02.05.2020'], ['Ника', '11.09.2023']], lastVisit: '19.08.2026', seededBalance: 3400, since: '14.02.2024', visits: 26, ordersTotal: 48350, comment: 'Скидка подтверждена до 31.12.2026, действует на все посещения.', file: { name: 'удостоверение_многодетной.pdf', size: '340 КБ' }, discountUntil: '31.12.2026' },
  { id: 'cl-vereshchagin', fullName: 'Верещагин Павел Олегович', phone: '9032715540', birthDate: '27.07.1988', discountPct: 0, discountGround: '', children: [['Тимофей', '19.01.2022']], lastVisit: '17.08.2026', seededBalance: 0, since: '05.06.2025', visits: 7, ordersTotal: 9100 },
  { id: 'cl-nasibullin', fullName: 'Насибуллин Рустам Ильдарович', phone: '9278106392', birthDate: '02.12.1985', discountPct: 5, discountGround: 'Ручная', children: [['Амина', '30.08.2019']], lastVisit: '11.08.2026', seededBalance: 0, since: '11.11.2024', visits: 9, ordersTotal: 31200, comment: 'Скидка 5 % назначена администратором за постоянные праздники.' },
  { id: 'cl-gavrilova', fullName: 'Гаврилова Ольга Дмитриевна', phone: '9856023188', birthDate: '21.09.1990', discountPct: 10, discountGround: 'Многодетная семья', children: [['Софья', '12.04.2023'], ['Егор', '08.03.2017']], lastVisit: '16.08.2026', seededBalance: 0, since: '02.02.2025', visits: 14, ordersTotal: 19800 },
  { id: 'cl-dolgikh', fullName: 'Долгих Кирилл Антонович', phone: '9991452073', birthDate: '16.05.1987', discountPct: 0, discountGround: '', children: [['Влада', '25.10.2020']], lastVisit: '09.08.2026', seededBalance: 6750, since: '18.07.2025', visits: 5, ordersTotal: 24600 },
  { id: 'cl-erokhina', fullName: 'Ерохина Марина Петровна', phone: '9623301854', birthDate: '03.02.1992', discountPct: 5, discountGround: 'Ручная', children: [['Артём', '07.07.2020']], lastVisit: '19.08.2026', seededBalance: 0, since: '30.09.2024', visits: 11, ordersTotal: 13400 },
  { id: 'cl-shatalov', fullName: 'Шаталов Игорь Валерьевич', phone: '9112076431', birthDate: '11.11.1983', discountPct: 0, discountGround: '', children: [['Кира', '22.05.2019'], ['Родион', '14.08.2016']], lastVisit: '19.08.2026', seededBalance: 960, since: '12.01.2024', visits: 18, ordersTotal: 33900 },
  { id: 'cl-belova', fullName: 'Белова Екатерина Романовна', phone: '9775120977', birthDate: '29.06.1993', discountPct: 0, discountGround: '', children: [['Платон', '05.12.2020']], lastVisit: '19.08.2026', seededBalance: 0, since: '21.04.2026', visits: 3, ordersTotal: 2850 },
  { id: 'cl-tikhonova', fullName: 'Тихонова Юлия Андреевна', phone: '9098844512', birthDate: '17.08.1994', discountPct: 10, discountGround: 'Многодетная семья', children: [['Милана', '01.03.2022']], lastVisit: '19.08.2026', seededBalance: 0, since: '08.05.2025', visits: 8, ordersTotal: 11200 },
  { id: 'cl-askerov', fullName: 'Аскеров Тимур Рашидович', phone: '9624719008', birthDate: '05.04.1989', discountPct: 0, discountGround: '', children: [['Лейла', '18.02.2023']], lastVisit: '19.08.2026', seededBalance: 0, since: '14.06.2026', visits: 2, ordersTotal: 1400 },
  { id: 'cl-muradova', fullName: 'Мурадова Алина Эльдаровна', phone: '9261187240', birthDate: '23.10.1986', discountPct: 0, discountGround: '', children: [['Самира', '09.09.2021'], ['Даниэль', '27.12.2017']], lastVisit: '19.08.2026', seededBalance: 0, since: '03.03.2025', visits: 10, ordersTotal: 17600 },
  { id: 'cl-zykov', fullName: 'Зыков Денис Максимович', phone: '9316402519', birthDate: '30.01.1991', discountPct: 0, discountGround: '', children: [['Матвей', '16.11.2019']], lastVisit: '19.08.2026', seededBalance: 0, since: '27.10.2025', visits: 4, ordersTotal: 3600 },
  { id: 'cl-kuznetsova', fullName: 'Кузнецова Ирина Сергеевна', phone: '9168025366', birthDate: '12.12.1987', discountPct: 15, discountGround: 'Многодетная семья', children: [['Полина', '04.08.2022'], ['Глеб', '19.03.2019'], ['Тая', '28.06.2017']], lastVisit: '19.08.2026', seededBalance: 0, since: '09.09.2023', visits: 21, ordersTotal: 39700, file: { name: 'удостоверение_многодетной.pdf', size: '312 КБ' }, discountUntil: '31.12.2026' },
  { id: 'cl-solovyov', fullName: 'Соловьёв Артём Николаевич', phone: '9035597124', birthDate: '07.07.1984', discountPct: 0, discountGround: '', children: [['Мирон', '13.05.2020']], lastVisit: '19.08.2026', seededBalance: 14200, since: '22.11.2025', visits: 6, ordersTotal: 28400 },
  { id: 'cl-pakhomova', fullName: 'Пахомова Вера Ильинична', phone: '9852143890', birthDate: '18.09.1995', discountPct: 0, discountGround: '', children: [['Юна', '02.02.2023']], lastVisit: '19.08.2026', seededBalance: 0, since: '11.02.2026', visits: 5, ordersTotal: 5200 },
  { id: 'cl-yusupov', fullName: 'Юсупов Марат Ринатович', phone: '9173554602', birthDate: '25.03.1988', discountPct: 0, discountGround: '', children: [['Азалия', '11.06.2021']], lastVisit: '19.08.2026', seededBalance: 0, since: '19.08.2025', visits: 6, ordersTotal: 4900 },
  { id: 'cl-lapina', fullName: 'Лапина Светлана Юрьевна', phone: '9687031185', birthDate: '09.05.1990', discountPct: 0, discountGround: '', children: [['Никита', '21.09.2017']], lastVisit: '19.08.2026', seededBalance: 0, since: '06.12.2024', visits: 13, ordersTotal: 14700 },
  // Two clients carrying debt from earlier shifts — this is what makes the
  // «Задолженность» figure larger than the open orders of this shift alone.
  { id: 'cl-safronova', fullName: 'Сафронова Ольга Петровна', phone: '9210678433', birthDate: '14.01.1992', discountPct: 0, discountGround: '', children: [['Арина', '03.04.2021']], lastVisit: '24.08.2026', seededBalance: 0, since: '15.05.2025', visits: 9, ordersTotal: 12600, comment: 'Долг с 24.08.2026 — обещала погасить при следующем визите.' },
  { id: 'cl-ignatyev', fullName: 'Игнатьев Роман Сергеевич', phone: '9053321947', birthDate: '02.08.1986', discountPct: 0, discountGround: '', children: [['Демид', '17.07.2019']], lastVisit: '26.08.2026', seededBalance: 0, since: '01.08.2024', visits: 15, ordersTotal: 21800, comment: 'Долг с 26.08.2026, договорились на оплату картой.' },
]

function buildClients(): Client[] {
  return CLIENT_SEEDS.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    phone: s.phone,
    birthDate: s.birthDate,
    discountPct: s.discountPct,
    discountGround: s.discountGround,
    discountUntil: s.discountUntil ?? '',
    comment: s.comment ?? '',
    file: s.file,
    children: s.children.map(([name, birthDate], i) => ({ id: `${s.id}-ch${i}`, name, birthDate })),
    since: s.since,
    visits: s.visits,
    lastVisit: s.lastVisit,
    seededBalance: s.seededBalance,
    ordersTotal: s.ordersTotal,
  }))
}

/* ============================================================
   Users, roles, settings
   ============================================================ */

export const USERS: User[] = [
  {
    id: 'u-smirnova', fullName: 'Смирнова Елена Викторовна', role: 'Администратор',
    phone: '9211004011', schedule: '09:00—21:00', accessSummary: 'Заказы, клиенты, касса',
    presence: 'in-shift', pin: '1111', status: 'working', shiftsThisMonth: 12, discrepancies: 0,
    access: { ordersPayment: true, cashPayment: true, clientsEdit: true, catalogEdit: false, settings: false },
  },
  {
    id: 'u-romanova', fullName: 'Романова Ксения Павловна', role: 'Администратор',
    phone: '9035520819', schedule: 'Выходной', accessSummary: 'Заказы, клиенты, касса',
    presence: 'off', pin: '2222', status: 'working', shiftsThisMonth: 11, discrepancies: 1,
    access: { ordersPayment: true, cashPayment: true, clientsEdit: true, catalogEdit: false, settings: false },
  },
  {
    id: 'u-beketov', fullName: 'Бекетов Илья Сергеевич', role: 'Кассир',
    phone: '9167412365', schedule: '09:00—17:00', accessSummary: 'Оплата заказов',
    presence: 'in-shift', pin: '3333', status: 'working', shiftsThisMonth: 19, discrepancies: 1,
    access: { ordersPayment: true, cashPayment: true, clientsEdit: false, catalogEdit: false, settings: false },
  },
  {
    id: 'u-tarasov', fullName: 'Тарасов Дмитрий Олегович', role: 'Управляющий',
    phone: '9118435277', schedule: 'По запросу', accessSummary: 'Все разделы',
    presence: 'invited', pin: '4444', status: 'working', shiftsThisMonth: 2, discrepancies: 0,
    access: { ordersPayment: true, cashPayment: true, clientsEdit: true, catalogEdit: true, settings: true },
  },
]

export const ROLES: Role[] = [
  { name: 'Управляющий', people: 1, orders: 'Полный доступ', clients: 'Полный доступ', cash: 'Полный доступ', discounts: 'Любые', catalog: 'Изменение' },
  { name: 'Администратор', people: 2, orders: 'Создание, оплата', clients: 'Создание, правка', cash: 'Приём оплаты', discounts: 'До 15 %', catalog: 'Просмотр' },
  { name: 'Кассир', people: 1, orders: 'Оплата', clients: 'Просмотр', cash: 'Приём оплаты', discounts: 'Нет', catalog: 'Просмотр' },
]

export const REQUISITES: Requisites = {
  name: 'ООО «Аква пати»',
  inn: '7802345671',
  kpp: '780201001',
  ogrn: '1237800045612',
  taxation: 'УСН, доходы 6 %',
  legalAddress: '196143, Санкт-Петербург, ул. Ленина, 14, пом. 21',
  actualAddress: 'Санкт-Петербург, ул. Ленина, 14, ТЦ «Волна», 2 этаж',
  phone: '8124480014',
  email: 'hello@aquaparty.ru',
  site: 'aquaparty.ru',
}

export const PAYMENT_SETTINGS: PaymentSettings = {
  methods: [
    { id: 'pm-cash', label: 'Наличные', enabled: true },
    { id: 'pm-card', label: 'Банковская карта', enabled: true },
    { id: 'pm-sbp', label: 'СБП по QR-коду', enabled: true },
    { id: 'pm-post', label: 'Оплата на выходе (постоплата)', enabled: false },
    { id: 'pm-invoice', label: 'Оплата по счёту для организаций', enabled: false },
  ],
  collectionGrounds: ['Плановая выемка в сейф', 'Сдача в банк', 'Передача управляющему', 'Закупка расходников'],
  // «Остаток на начало дня» — как внести деньги в кассу, которая начинает
  // день пустой; в обычной смене остаток уже лежит в ящике.
  depositGrounds: ['Остаток на начало дня', 'Довнесение размена', 'Возврат неиспользованных средств', 'Погашение недостачи'],
  discrepancyReasons: ['Ошибка при выдаче сдачи', 'Не проведённая оплата', 'Неучтённый возврат', 'Излишек при пересчёте'],
  refundReasons: ['Ребёнку не подошёл товар', 'Отказ от посещения', 'Отмена праздника', 'Болезнь ребёнка', 'Ошибка администратора в заказе'],
}

export const NOTIFICATIONS: NotificationRule[] = [
  { id: 'n1', scenario: 'Заказ создан', recipient: 'Клиент', channel: 'SMS', when: 'Сразу', enabled: true },
  { id: 'n2', scenario: 'Оплата принята', recipient: 'Клиент', channel: 'SMS · чек на почту', when: 'Сразу', enabled: true },
  { id: 'n3', scenario: 'День рождения ребёнка', recipient: 'Клиент', channel: 'SMS', when: 'За 10 дней', enabled: true },
  { id: 'n4', scenario: 'Напоминание о празднике', recipient: 'Клиент', channel: 'SMS', when: 'За сутки', enabled: true },
  { id: 'n5', scenario: 'Задолженность по заказу', recipient: 'Администратор', channel: 'CRM', when: 'При закрытии смены', enabled: false },
  { id: 'n6', scenario: 'Возврат оформлен', recipient: 'Управляющий', channel: 'CRM · почта', when: 'Сразу', enabled: false },
]

/* ============================================================
   Shift 218 and its history
   ============================================================ */

export const CURRENT_SHIFT_NO = 218
export const COLLECTION_AMOUNT = 30000
/** Targets the canvas states on four separate screens. The generated part
 *  of the shift is solved to land on them exactly. */
/** Cash taken from clients over the shift. The drawer's opening balance and
 *  the collection are movements, not takings, so they stay out of the solve. */
const TARGET_CASH_TAKEN = 64963
const TARGET_CASHLESS = 102920
const TARGET_REFUNDS = 1543
const TARGET_DEBT = 13802

const ADMIN = 'Смирнова Е. В.'
const CASHIER = 'Бекетов И. С.'

export const PAST_SHIFTS: Shift[] = [
  { no: 217, date: '29.08.2026', openedAt: t(9, 0), closedAt: t(21, 12), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 51, cash: 44180, cashless: 118640, closingCash: 8060, discrepancy: 0, status: 'closed' },
  { no: 216, date: '28.08.2026', openedAt: t(9, 0), closedAt: t(21, 4), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 39, cash: 31250, cashless: 88300, closingCash: 7500, discrepancy: -560, status: 'discrepancy' },
  { no: 215, date: '27.08.2026', openedAt: t(9, 0), closedAt: t(20, 58), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 34, cash: 28900, cashless: 76420, closingCash: 6900, discrepancy: 0, status: 'closed' },
  { no: 214, date: '26.08.2026', openedAt: t(9, 0), closedAt: t(21, 20), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 43, cash: 36740, cashless: 95180, closingCash: 8240, discrepancy: 0, status: 'closed' },
  { no: 213, date: '25.08.2026', openedAt: t(9, 0), closedAt: t(21, 6), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 29, cash: 24100, cashless: 61850, closingCash: 6100, discrepancy: 0, status: 'closed' },
  { no: 212, date: '24.08.2026', openedAt: t(9, 0), closedAt: t(21, 44), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 62, cash: 52300, cashless: 141900, closingCash: 9450, discrepancy: 0, status: 'closed' },
  { no: 211, date: '23.08.2026', openedAt: t(9, 0), closedAt: t(21, 38), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 58, cash: 49620, cashless: 133470, closingCash: 8820, discrepancy: -780, status: 'discrepancy' },
  { no: 210, date: '22.08.2026', openedAt: t(9, 0), closedAt: t(21, 2), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 41, cash: 34950, cashless: 92300, closingCash: 7310, discrepancy: 0, status: 'closed' },
  { no: 209, date: '21.08.2026', openedAt: t(9, 0), closedAt: t(20, 54), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 37, cash: 30480, cashless: 81200, closingCash: 6640, discrepancy: 0, status: 'closed' },
  { no: 208, date: '20.08.2026', openedAt: t(9, 0), closedAt: t(21, 10), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 44, cash: 37610, cashless: 98740, closingCash: 7980, discrepancy: 0, status: 'closed' },
  { no: 207, date: '19.08.2026', openedAt: t(9, 0), closedAt: t(21, 16), admin: ADMIN, cashier: 'Смирнова Е. В.', opening: 5000, ops: 42, cash: 38900, cashless: 109720, closingCash: 8150, discrepancy: 0, status: 'closed' },
  { no: 206, date: '18.08.2026', openedAt: t(9, 0), closedAt: t(20, 50), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 31, cash: 26340, cashless: 68900, closingCash: 6420, discrepancy: 0, status: 'closed' },
  { no: 205, date: '17.08.2026', openedAt: t(9, 0), closedAt: t(21, 32), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 55, cash: 46800, cashless: 126300, closingCash: 9100, discrepancy: 0, status: 'closed' },
  { no: 204, date: '16.08.2026', openedAt: t(9, 0), closedAt: t(21, 26), admin: ADMIN, cashier: 'Смирнова Е. В.', opening: 5000, ops: 49, cash: 41200, cashless: 112480, closingCash: 8360, discrepancy: 0, status: 'closed' },
  { no: 203, date: '15.08.2026', openedAt: t(9, 0), closedAt: t(21, 8), admin: ADMIN, cashier: 'Романова К. П.', opening: 5000, ops: 36, cash: 29750, cashless: 79640, closingCash: 6750, discrepancy: 0, status: 'closed' },
  { no: 202, date: '14.08.2026', openedAt: t(9, 0), closedAt: t(21, 0), admin: ADMIN, cashier: CASHIER, opening: 5000, ops: 33, cash: 27400, cashless: 72150, closingCash: 6280, discrepancy: 0, status: 'closed' },
  // The rest of the month, so «31 смена» is a real count.
  ...Array.from({ length: 14 }, (_, i): Shift => {
    const no = 201 - i
    const day = 13 - i
    const ops = 30 + ((i * 7) % 25)
    return {
      no,
      date: `${String(day).padStart(2, '0')}.08.2026`,
      openedAt: t(9, 0),
      closedAt: t(21, (i * 5) % 40),
      admin: ADMIN,
      cashier: i % 2 === 0 ? CASHIER : 'Романова К. П.',
      opening: 5000,
      ops,
      cash: 24000 + ((i * 2130) % 26000),
      cashless: 62000 + ((i * 5470) % 72000),
      closingCash: 6000 + ((i * 430) % 3500),
      discrepancy: 0,
      status: 'closed',
    }
  }),
]

/* ============================================================
   Orders of shift 218
   ============================================================ */

interface OrderSeed {
  no: number
  createdAt: number
  endedAt?: number
  closedAt?: number
  clientId: string
  tariffItemId: string
  tariffLabel: string
  lines: [string, number][]
  comment?: string
  manualDiscount?: number
  /** [amount, method, title, at] — amount `null` means «pay it in full». */
  payments?: [number | null, PaymentMethod, string, number][]
  childIds?: number[]
}

const ORDER_SEEDS: OrderSeed[] = [
  {
    no: 4812, createdAt: t(13, 42), clientId: 'cl-smirnova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0, 1],
    lines: [['tariff-2h', 2], ['svc-aquagrim', 2], ['gd-socks', 1]],
    comment: 'Празднование дня рождения Льва, столик у окна на 14:00.',
    payments: [[null, 'Наличные', 'Оплата заказа', t(13, 42)]],
  },
  {
    no: 4811, createdAt: t(13, 15), clientId: 'cl-kovaleva',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0, 1, 2],
    lines: [['tariff-2h', 3], ['svc-aquagrim', 2], ['gd-towel', 1], ['gd-socks', 2]],
    payments: [[null, 'Карта', 'Оплата заказа', t(13, 20)]],
  },
  {
    // The order the whole canvas is threaded through: 12 950 → −648 → −5 000 → 7 302.
    no: 4810, createdAt: t(12, 58), clientId: 'cl-nasibullin',
    tariffItemId: 'svc-morskaya', tariffLabel: 'Праздничная программа', childIds: [0],
    lines: [['svc-morskaya', 1], ['svc-aquagrim', 1]],
    comment: 'Праздник Амины, торт привезут к 16:30. Остаток оплатят на выходе.',
    payments: [[5000, 'Карта', 'Частичная оплата', t(13, 4)]],
  },
  {
    no: 4809, createdAt: t(12, 30), closedAt: t(14, 35), clientId: 'cl-gavrilova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0, 1],
    lines: [['tariff-2h', 2], ['gd-socks', 1]],
    payments: [[null, 'Наличные', 'Оплата заказа', t(14, 35)]],
  },
  {
    no: 4808, createdAt: t(11, 47), closedAt: t(14, 12), clientId: 'cl-vereshchagin',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч + доплата', childIds: [0],
    lines: [['tariff-2h', 1], ['gd-socks', 1]],
    payments: [
      [250, 'Наличные', 'Продажа товара', t(11, 47)],
      [null, 'Наличные', 'Оплата заказа', t(11, 59)],
    ],
  },
  {
    no: 4807, createdAt: t(11, 12), clientId: 'cl-dolgikh',
    tariffItemId: 'svc-morskaya', tariffLabel: 'Праздничная программа', childIds: [0],
    lines: [['svc-morskaya', 1]],
    payments: [[6250, 'Карта', 'Предоплата 50 %', t(11, 22)]],
  },
  {
    no: 4806, createdAt: t(10, 35), closedAt: t(12, 31), clientId: 'cl-erokhina',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0],
    lines: [['tariff-2h', 1], ['gd-socks', 1], ['gd-scrunchie', 1]],
    payments: [[null, 'Наличные', 'Оплата заказа', t(11, 5)]],
  },
  {
    no: 4805, createdAt: t(10, 4), closedAt: t(12, 10), clientId: 'cl-tikhonova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0],
    lines: [['tariff-2h', 1], ['svc-aquagrim', 1]],
    payments: [[null, 'Карта', 'Оплата заказа', t(12, 10)]],
  },
  {
    no: 4804, createdAt: t(9, 52), closedAt: t(11, 48), clientId: 'cl-shatalov',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0, 1],
    lines: [['tariff-2h', 4]],
    payments: [[null, 'Карта', 'Оплата заказа', t(11, 48)]],
  },
  {
    no: 4803, createdAt: t(9, 31), clientId: 'cl-belova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0],
    lines: [['tariff-2h', 1], ['gd-socks', 1]],
    payments: [],
  },
  {
    no: 4802, createdAt: t(9, 18), closedAt: t(11, 16), clientId: 'cl-askerov',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0],
    lines: [['tariff-2h', 1]],
    payments: [[null, 'Наличные', 'Оплата заказа', t(11, 16)]],
  },
  {
    no: 4801, createdAt: t(9, 5), closedAt: t(11, 5), clientId: 'cl-lapina',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч',
    lines: [['tariff-2h', 1], ['gd-cap', 1]],
    payments: [[null, 'Наличные', 'Оплата заказа', t(9, 54)]],
  },
  {
    no: 4800, createdAt: t(8, 58), closedAt: t(10, 52), clientId: 'cl-zykov',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч',
    lines: [['tariff-2h', 1]],
    payments: [[null, 'Карта', 'Оплата заказа', t(10, 52)]],
  },
  {
    no: 4799, createdAt: t(8, 44), closedAt: t(10, 50), clientId: 'cl-muradova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч',
    lines: [['tariff-2h', 2], ['gd-socks', 2]],
    payments: [[null, 'Карта', 'Оплата заказа', t(9, 38)]],
  },
  {
    no: 4798, createdAt: t(8, 30), clientId: 'cl-solovyov',
    tariffItemId: 'svc-piraty', tariffLabel: 'Праздничная программа', childIds: [0],
    lines: [['svc-piraty', 1]],
    payments: [[7100, 'Карта', 'Предоплата 50 %', t(8, 40)]],
  },
  {
    no: 4797, createdAt: t(8, 22), closedAt: t(10, 18), clientId: 'cl-pakhomova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч',
    lines: [['tariff-2h', 1], ['gd-bag', 1]],
    payments: [[null, 'Наличные', 'Оплата заказа', t(9, 16)]],
  },
  {
    no: 4796, createdAt: t(8, 11), closedAt: t(10, 9), clientId: 'cl-yusupov',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч',
    lines: [['tariff-2h', 1]],
    payments: [[null, 'Наличные', 'Оплата заказа', t(10, 9)]],
  },
  {
    // Open, the visit is over, time ran past the tariff and nothing is paid —
    // the one order the canvas colours red.
    no: 4795, createdAt: t(8, 3), endedAt: t(10, 15), clientId: 'cl-kuznetsova',
    tariffItemId: 'tariff-2h', tariffLabel: 'Разовый, 2 ч', childIds: [0, 1, 2],
    lines: [['tariff-2h', 3], ['svc-aquagrim', 2]],
    payments: [],
  },
]

function makeItems(no: number, lines: [string, number][]): OrderItem[] {
  return lines.map(([catalogItemId, qty], i) => {
    const c = CATALOG.find((x) => x.id === catalogItemId)!
    return { id: `oi-${no}-${i}`, catalogItemId, name: c.name, unit: c.unit, price: c.price, qty }
  })
}

/** Fills in the payment amounts marked `null` — those settle the order in
 *  full, which needs the totals, which need the client. */
function buildExplicitOrders(clients: Client[]): Order[] {
  return ORDER_SEEDS.map((s) => {
    const client = clients.find((c) => c.id === s.clientId)!
    const order: Order = {
      id: `o-${s.no}`,
      no: s.no,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
      closedAt: s.closedAt,
      clientId: s.clientId,
      childIds: (s.childIds ?? []).map((i) => client.children[i]?.id).filter((x): x is string => !!x),
      tariffItemId: s.tariffItemId,
      tariffLabel: s.tariffLabel,
      items: makeItems(s.no, s.lines),
      comment: s.comment ?? '',
      manualDiscount: s.manualDiscount ?? 0,
      payments: [],
      status: s.closedAt !== undefined ? 'closed' : 'open',
      refunds: [],
    }

    const totals = orderTotals(order, client, tariffDuration(s.tariffItemId))
    let running = 0
    order.payments = (s.payments ?? []).map(([amount, method, title, at], i) => {
      const value = amount ?? Math.max(0, totals.payable - running)
      running += value
      return {
        id: `p-${s.no}-${i}`,
        at,
        amount: value,
        method,
        title,
        cashier: title === 'Частичная оплата' || title.startsWith('Предоплата') ? ADMIN : CASHIER,
      }
    })
    return order
  })
}

/** The refund the canvas shows in the cash journal: socks and a scrunchie off
 *  order 4806, recalculated through the client's 5 %. */
function attachSeededRefund(orders: Order[], clients: Client[]): void {
  const order = orders.find((o) => o.no === 4806)
  if (!order) return
  const client = clients.find((c) => c.id === order.clientId)
  const socks = order.items.find((i) => i.catalogItemId === 'gd-socks')
  const scrunchie = order.items.find((i) => i.catalogItemId === 'gd-scrunchie')
  if (!socks || !scrunchie) return
  const gross = socks.price * 1 + scrunchie.price * 1
  const pct = client?.discountPct ?? 0
  const amount = gross - Math.round((gross * pct) / 100)
  order.refunds.push({
    id: 'r-4806',
    at: t(12, 18),
    lines: [
      { orderItemId: socks.id, qty: 1 },
      { orderItemId: scrunchie.id, qty: 1 },
    ],
    amount,
    reason: 'Ребёнку не подошёл товар',
    method: 'Наличные',
    by: `${ADMIN}, администратор`,
  })
}

/* ------------------------------------------------------------
   The other 24 orders of the 42-order shift.

   Their lines are ordinary catalog positions; the quantities are the free
   variable, chosen so the shift's cash and cashless land exactly on the
   figures the canvas shows. Whatever is left over after whole quantities
   is absorbed by a «Разовая скидка» on the last order — which is precisely
   what that field is for.
   ------------------------------------------------------------ */

const FILLER_CLIENTS = [
  'cl-smirnova', 'cl-kovaleva', 'cl-vereshchagin', 'cl-gavrilova', 'cl-erokhina',
  'cl-shatalov', 'cl-tikhonova', 'cl-askerov', 'cl-muradova', 'cl-zykov',
  'cl-pakhomova', 'cl-yusupov', 'cl-lapina', 'cl-safronova', 'cl-ignatyev',
]

function buildFillerOrders(clients: Client[], explicit: Order[]): Order[] {
  const cashPaid = sumPayments(explicit, 'Наличные')
  const cashlessPaid = sumPayments(explicit, 'Карта') + sumPayments(explicit, 'СБП по QR')
  const refunded = explicit.reduce((s, o) => s + o.refunds.reduce((a, r) => a + r.amount, 0), 0)

  const cashNeeded = TARGET_CASH_TAKEN - cashPaid
  const cashlessNeeded = TARGET_CASHLESS - cashlessPaid
  const extraRefund = TARGET_REFUNDS - refunded

  const orders: Order[] = []
  const cashCount = 13
  const cashlessCount = 11
  const plan: { method: PaymentMethod; target: number }[] = [
    ...split(cashNeeded, cashCount).map((target) => ({ method: 'Наличные' as PaymentMethod, target })),
    ...split(cashlessNeeded, cashlessCount).map((target) => ({ method: 'Карта' as PaymentMethod, target })),
  ]

  let no = 4794 - plan.length + 1
  let minute = t(8, 5)
  const shortfalls: Record<string, number> = { Наличные: 0, Карта: 0 }

  plan.forEach((slot, idx) => {
    const client = clients.find((c) => c.id === FILLER_CLIENTS[idx % FILLER_CLIENTS.length]!)!
    const lines = fillLines(slot.target, client.discountPct)
    const order: Order = {
      id: `o-${no}`,
      no,
      createdAt: minute,
      closedAt: minute + 118,
      clientId: client.id,
      childIds: client.children[0] ? [client.children[0].id] : [],
      tariffItemId: 'tariff-2h',
      tariffLabel: 'Разовый, 2 ч',
      items: makeItems(no, lines),
      comment: '',
      manualDiscount: 0,
      payments: [],
      status: 'closed',
      refunds: [],
    }
    const totals = orderTotals(order, client, 120)
    // Trim the overshoot with a one-off discount so the shift totals are exact.
    const overshoot = totals.payable - slot.target
    if (overshoot >= 0 && overshoot < totals.payable) {
      order.manualDiscount = overshoot
    } else {
      shortfalls[slot.method] = (shortfalls[slot.method] ?? 0) + (slot.target - totals.payable)
    }
    const settled = orderTotals(order, client, 120)
    order.payments = [
      {
        id: `p-${no}-0`,
        at: order.closedAt!,
        amount: settled.payable,
        method: slot.method,
        title: 'Оплата заказа',
        cashier: CASHIER,
      },
    ]
    orders.push(order)
    no += 1
    minute += 11
  })

  // Any residual lands on the last order paid the same way, so the cash and
  // cashless columns stay exact rather than only their sum.
  for (const [method, delta] of Object.entries(shortfalls)) {
    if (delta === 0) continue
    const host = [...orders].reverse().find((o) => o.payments[0]?.method === method)
    if (!host) continue
    host.payments[0]!.amount += delta
    host.manualDiscount = Math.max(0, host.manualDiscount - delta)
  }

  if (extraRefund > 0) {
    const host = orders.find((o) => o.payments[0]?.method === 'Наличные' && o.payments[0].amount > extraRefund)
    if (host) {
      host.refunds.push({
        id: `r-${host.no}`,
        at: t(13, 26),
        lines: [],
        amount: extraRefund,
        reason: 'Отказ от посещения',
        method: 'Наличные',
        by: `${ADMIN}, администратор`,
      })
    }
  }

  return orders
}

function sumPayments(orders: Order[], method: PaymentMethod): number {
  return orders.reduce(
    (s, o) => s + o.payments.filter((p) => p.method === method).reduce((a, p) => a + p.amount, 0),
    0,
  )
}

/** Splits a total into `n` plausible, uneven order values. */
function split(total: number, n: number): number[] {
  const base = Math.floor(total / n)
  const out: number[] = []
  let rest = total
  for (let i = 0; i < n - 1; i += 1) {
    const jitter = Math.round(base * (0.45 * Math.sin(i * 2.3) + 0.1 * Math.cos(i * 5.1)))
    const value = Math.max(700, base + jitter)
    out.push(value)
    rest -= value
  }
  out.push(Math.max(700, rest))
  return out
}

/** Composes catalog lines whose payable lands at or just above `target`. */
function fillLines(target: number, discountPct: number): [string, number][] {
  const gross = Math.ceil(target / (1 - discountPct / 100))
  const lines: [string, number][] = []
  let rest = gross

  const visits = Math.max(1, Math.min(6, Math.floor(rest / price('tariff-2h'))))
  lines.push(['tariff-2h', visits])
  rest -= visits * price('tariff-2h')

  for (const id of ['svc-morskaya', 'svc-bubbles', 'gd-robe', 'gd-towel', 'svc-aquagrim', 'gd-cap', 'gd-socks', 'gd-scrunchie'] as const) {
    if (rest <= 0) break
    const qty = Math.floor(rest / price(id))
    if (qty > 0) {
      lines.push([id, Math.min(qty, 4)])
      rest -= Math.min(qty, 4) * price(id)
    }
  }

  // Overshoot deliberately: the caller trims the excess with a one-off
  // discount, and only an overshoot can be trimmed exactly.
  if (rest > 0) {
    const existing = lines.find(([id]) => id === 'gd-scrunchie')
    if (existing) existing[1] += 1
    else lines.push(['gd-scrunchie', 1])
  }
  return lines
}

/* ============================================================
   Assembly
   ============================================================ */

export interface SeedData {
  clients: Client[]
  orders: Order[]
  cashOps: CashOp[]
  users: User[]
  shifts: Shift[]
}

/** The first order number of a shift that starts from nothing. */
export const FIRST_ORDER_NO = 4801

/**
 * A till with nothing in it: no orders, no operations, no history, and every
 * client's balance at zero. The catalogue, the staff and the client list stay,
 * because you cannot ring anything up without them.
 *
 * This is the state to walk the day through by hand — put the float in as a
 * «внесение», create the orders, close them, and check every operation.
 */
export function buildEmpty(): SeedData {
  return {
    clients: buildClients().map((c) => ({
      ...c,
      seededBalance: 0,
      visits: 0,
      ordersTotal: 0,
      lastVisit: '—',
    })),
    orders: [],
    cashOps: [],
    users: USERS.map((u) => ({ ...u, access: { ...u.access } })),
    shifts: [],
  }
}

export function buildSeed(): SeedData {
  const clients = buildClients()
  const explicit = buildExplicitOrders(clients)
  attachSeededRefund(explicit, clients)
  const filler = buildFillerOrders(clients, explicit)
  const orders = [...explicit, ...filler].sort((a, b) => b.no - a.no)

  // Carry-over debt. A client only owes money when their whole balance goes
  // negative — a party paid 50 % up front is prepaid, not in debt — so the
  // figure is measured over balances, then topped up to what the canvas
  // states by the two clients who owe from earlier shifts.
  const owedBy = (clientId: string) =>
    orders
      .filter((o) => o.clientId === clientId && o.status === 'open')
      .reduce((sum, o) => {
        const client = clients.find((c) => c.id === clientId)
        return sum + orderTotals(o, client, tariffDuration(o.tariffItemId)).remainder
      }, 0)

  const liveDebt = clients.reduce((sum, c) => {
    const balance = c.seededBalance - owedBy(c.id)
    return sum + (balance < 0 ? -balance : 0)
  }, 0)

  const carryOver = Math.max(0, TARGET_DEBT - liveDebt)
  const safronova = clients.find((c) => c.id === 'cl-safronova')!
  const ignatyev = clients.find((c) => c.id === 'cl-ignatyev')!
  safronova.seededBalance = -Math.round(carryOver * 0.56)
  ignatyev.seededBalance = -(carryOver + safronova.seededBalance)

  return {
    clients,
    orders,
    cashOps: houseOps(),
    users: USERS.map((u) => ({ ...u, access: { ...u.access } })),
    shifts: PAST_SHIFTS,
  }
}

/** Operations that are not tied to an order: the opening float and the
 *  collection. Everything else in the journal is derived from orders. */
function houseOps(): CashOp[] {
  return [
    {
      id: 'op-collect', at: t(12, 51), subject: 'Инкассация', kind: 'Выемка',
      method: 'Наличные', amount: -COLLECTION_AMOUNT, cashier: ADMIN,
    },
  ]
}
