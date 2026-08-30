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
