/** Money is shown without a currency sign and without kopecks —
 *  «38 420», «−780» — as settled in the design conversation. */
export function money(n: number): string {
  const rounded = Math.round(n)
  const s = Math.abs(rounded).toLocaleString('ru-RU').replace(/ /g, ' ')
  return rounded < 0 ? `−${s}` : s
}

/** A dash stands in for an absent amount everywhere in the canvas. */
export const DASH = '—'

export function moneyOrDash(n: number): string {
  return n === 0 ? DASH : money(n)
}

export function signedMoney(n: number): string {
  if (n === 0) return DASH
  return n > 0 ? `+${money(n)}` : money(n)
}

export function percent(n: number): string {
  return n === 0 ? DASH : `${n} %`
}

/** Minutes since midnight → «13:42». */
export function clock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** A duration → «2:05» (hours are not zero-padded, as in the canvas). */
export function duration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

/** «2 часа», «1 час», «—» — the Длительность column in the directories. */
export function durationWords(minutes: number | undefined): string {
  if (!minutes) return DASH
  const h = minutes / 60
  if (Number.isInteger(h)) return `${h} ${plural(h, 'час', 'часа', 'часов')}`
  return `${minutes} мин`
}

/** Russian numeric agreement — the prototype shipped without it and it read badly. */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

export function counted(n: number, one: string, few: string, many: string): string {
  return `${money(n)} ${plural(n, one, few, many)}`
}

export function initials(fullName: string): string {
  const [last = '', first = ''] = fullName.split(' ')
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

/** «Смирнова Елена Викторовна» → «Смирнова Е. В.» — the signature form
 *  used in every cash operation. */
export function shortName(fullName: string): string {
  const [last, first, middle] = fullName.split(' ')
  if (!first) return last ?? ''
  const rest = [first, middle].filter(Boolean).map((p) => `${p!.charAt(0)}.`)
  return `${last} ${rest.join(' ')}`
}

/** «Е. Смирнова» — the topbar form. */
export function topbarName(fullName: string): string {
  const [last, first] = fullName.split(' ')
  return first ? `${first.charAt(0)}. ${last}` : (last ?? '')
}

/** Поиск клиента начинается с третьего символа — по одной-двум буквам
 *  совпадает пол-базы, и список подсказок бесполезен. */
export const MIN_SEARCH = 3

/** Нормализует запрос: пусто, пока символов меньше порога. */
export function searchQuery(raw: string): string {
  const q = raw.trim().toLowerCase()
  return q.length >= MIN_SEARCH ? q : ''
}

/** Цифры телефона без форматирования — «+7 921 448-12-06» → «79214481206». */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/* ============================================================
   Форматированный ввод: дата и телефон
   ============================================================ */

/** Длина заполненного поля в цифрах — по ней поле считается готовым и
 *  фокус уходит дальше. */
export const DATE_DIGITS = 8
export const PHONE_DIGITS = 10

/** «02052020» → «02.05.2020». Точки расставляются сами, пользователь их
 *  не набирает. */
export function maskDate(raw: string): string {
  const d = digitsOnly(raw).slice(0, DATE_DIGITS)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`
}

/** Телефон — десять цифр без +7 и 8.
 *
 *  Ведущая семёрка — это код страны, российский номер из десяти цифр с неё не
 *  начинается, поэтому её отбрасываем сразу. Ведущая восьмёрка бывает частью
 *  номера (812 — Петербург), поэтому её убираем, только если без неё как раз
 *  выходит десять цифр — то есть вставили «8 921 …». */
export function maskPhone(raw: string): string {
  let d = digitsOnly(raw)
  while (d.startsWith('7')) d = d.slice(1)
  if (d.length === PHONE_DIGITS + 1 && d.startsWith('8')) d = d.slice(1)
  return d.slice(0, PHONE_DIGITS)
}

/** Дата заполнена и правдоподобна. */
/** Настоящая календарная дата: «31.02.2020» и «99.99.9999» не проходят. */
export function isDateComplete(value: string): boolean {
  const d = digitsOnly(value)
  if (d.length !== DATE_DIGITS) return false
  const day = Number(d.slice(0, 2))
  const month = Number(d.slice(2, 4))
  const year = Number(d.slice(4))
  if (month < 1 || month > 12 || day < 1 || year < 1900) return false
  const dt = new Date(year, month - 1, day)
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day
}

/** Дата в прошлом или сегодня — для дней рождения. */
export function isPastDate(value: string): boolean {
  if (!isDateComplete(value)) return false
  const d = digitsOnly(value)
  const dt = new Date(Number(d.slice(4)), Number(d.slice(2, 4)) - 1, Number(d.slice(0, 2)))
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return dt <= today
}

/** Ошибка даты рождения — общая для родителя и ребёнка. */
export function birthDateError(value: string): string {
  if (value.trim() === '') return ''
  if (digitsOnly(value).length !== DATE_DIGITS) return 'Заполните дату целиком'
  if (!isDateComplete(value)) return 'Такой даты не бывает'
  if (!isPastDate(value)) return 'Дата в будущем'
  return ''
}

export function isPhoneComplete(value: string): boolean {
  return digitsOnly(value).length === PHONE_DIGITS
}

/* ===== Проверка данных ребёнка ===== */

/** Имя ребёнка — только кириллица, дефис и пробел. */
export const CYRILLIC_NAME = /^[А-Яа-яЁё][А-Яа-яЁё\- ]*$/

export function isChildNameValid(name: string): boolean {
  return CYRILLIC_NAME.test(name.trim())
}

/** Дети в центре — не старше 2010 года рождения. */
export const CHILD_MIN_YEAR = 2010

export function childBirthError(value: string): string {
  const common = birthDateError(value)
  if (common) return common
  if (Number(digitsOnly(value).slice(4)) < CHILD_MIN_YEAR) return `Не раньше ${CHILD_MIN_YEAR} года`
  return ''
}

/** Ввод текста — только кириллицей: латинские буквы не набираются.
 *  Цифры, пробелы и знаки препинания остаются — без них не написать
 *  ни адрес, ни режим работы, ни «Разовое посещение, 2 ч». */
export function onlyCyrillic(value: string): string {
  return value.replace(/[A-Za-z]/g, '')
}

/** Скидка — процент, а не что угодно: 0–100 включительно. */
export const MAX_DISCOUNT_PCT = 100

export function clampPercent(raw: string): number {
  const n = Number(digitsOnly(raw))
  if (!Number.isFinite(n)) return 0
  return Math.min(MAX_DISCOUNT_PCT, Math.max(0, n))
}

/** Телефон на экране: «+7 (921) 448-12-06». Хранится всегда 10 цифр. */
export function formatPhone(value: string): string {
  const d = digitsOnly(value).slice(0, PHONE_DIGITS)
  if (d.length === 0) return ''
  let out = `+7 (${d.slice(0, 3)}`
  if (d.length >= 3) out += ')'
  if (d.length > 3) out += ` ${d.slice(3, 6)}`
  if (d.length > 6) out += `-${d.slice(6, 8)}`
  if (d.length > 8) out += `-${d.slice(8, 10)}`
  return out
}

export function phoneError(value: string): string {
  if (value.trim() === '') return ''
  return isPhoneComplete(value) ? '' : `Нужно ${PHONE_DIGITS} цифр`
}

/** Потолок для любой денежной операции: миллион рублей за раз. */
export const MAX_AMOUNT = 1_000_000

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/** «30.08.2026» → Date. Пустая или битая строка — undefined. */
export function parseDate(value: string): Date | undefined {
  const d = digitsOnly(value)
  if (d.length !== DATE_DIGITS) return undefined
  const dt = new Date(Number(d.slice(4)), Number(d.slice(2, 4)) - 1, Number(d.slice(0, 2)))
  return Number.isNaN(dt.getTime()) ? undefined : dt
}

/** День недели считается из даты, а не задаётся руками. */
export function weekday(value: string): string {
  const dt = parseDate(value)
  return dt ? WEEKDAYS[dt.getDay()]! : DASH
}

/** «30 августа» — заголовок смены. */
export function dayAndMonth(value: string): string {
  const dt = parseDate(value)
  return dt ? `${dt.getDate()} ${MONTHS_GEN[dt.getMonth()]}` : value
}

/** Сегодняшняя дата в «дд.мм.гггг». */
export function today(): string {
  const d = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`
}
