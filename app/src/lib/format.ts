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
export function isDateComplete(value: string): boolean {
  const d = digitsOnly(value)
  if (d.length !== DATE_DIGITS) return false
  const day = Number(d.slice(0, 2))
  const month = Number(d.slice(2, 4))
  return day >= 1 && day <= 31 && month >= 1 && month <= 12
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
  const d = digitsOnly(value)
  if (d.length !== DATE_DIGITS) return 'Заполните дату целиком'
  if (!isDateComplete(value)) return 'Такой даты не бывает'
  const year = Number(d.slice(4))
  if (year < CHILD_MIN_YEAR) return `Не раньше ${CHILD_MIN_YEAR} года`
  if (year > new Date().getFullYear()) return 'Дата в будущем'
  return ''
}
