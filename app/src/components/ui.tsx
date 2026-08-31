import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { ArrowDown, Check, ChevronsUpDown, Search } from 'lucide-react'
import {
  MAX_AMOUNT,
  MIN_SEARCH,
  digitsOnly,
  formatPhone,
  isDateComplete,
  isPhoneComplete,
  maskDate,
  maskPhone,
  money,
  onlyCyrillic,
} from '../lib/format'

/* ===== Form fields ===== */

export function Field({
  label,
  children,
  className = '',
  error,
}: {
  label: string
  children: ReactNode
  className?: string
  /** Подсказка об ошибке под полем — пустая строка означает «всё в порядке». */
  error?: string
}) {
  return (
    <label className={`field-col ${className}`}>
      {label}
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  className = '',
  error,
  latin = false,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  error?: string
  /** Поля, которые по природе латинские: почта и сайт. */
  latin?: boolean
}) {
  return (
    <Field label={label} className={className} error={error}>
      <input
        className={error ? 'input invalid' : 'input'}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled || !onChange}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange?.(latin ? e.target.value : onlyCyrillic(e.target.value))
        }
      />
    </Field>
  )
}

/** A money field that keeps the «38 420» grouping while being editable. */
export function MoneyField({
  label,
  value,
  onChange,
  disabled,
  error,
  max = MAX_AMOUNT,
}: {
  label: string
  value: number
  onChange?: (v: number) => void
  disabled?: boolean
  error?: string
  /** Потолок суммы: миллион за операцию, если не сказано иное. */
  max?: number
}) {
  return (
    <Field label={label} error={error}>
      <input
        className={error ? 'input invalid' : 'input'}
        type="text"
        inputMode="numeric"
        value={money(value)}
        disabled={disabled || !onChange}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '')
          const next = digits === '' ? 0 : Number(digits)
          onChange?.(Math.min(next, max))
        }}
      />
    </Field>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <Field label={label} className={className}>
      <select className="input has-caret" value={value} onChange={(e) => onChange(e.target.value)}>
        {!options.includes(value) && <option value={value}>{value || '—'}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
}) {
  return (
    <Field label={label}>
      <textarea
        className="input"
        value={value}
        disabled={disabled || !onChange}
        onChange={(e) => onChange?.(onlyCyrillic(e.target.value))}
      />
    </Field>
  )
}

/** A field with the orange «+» tucked into its right edge. */
export function FieldWithPlus({
  label,
  value,
  onChange,
  onPlus,
  plusLabel,
  options,
  error,
  plusDisabled = false,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  onPlus: () => void
  plusLabel: string
  options?: string[]
  error?: string
  /** «+» гаснет, пока текущую строку не заполнили правильно. */
  plusDisabled?: boolean
}) {
  return (
    <Field label={label} error={error}>
      <span className="field-plus">
        {options ? (
          <select className="input has-caret" value={value} onChange={(e) => onChange?.(e.target.value)}>
            {!options.includes(value) && <option value={value}>{value || '—'}</option>}
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={error ? 'input invalid' : 'input'}
            type="text"
            value={value}
            disabled={!onChange}
            onChange={(e) => onChange?.(onlyCyrillic(e.target.value))}
          />
        )}
        <button
          type="button"
          aria-label={plusLabel}
          title={plusLabel}
          disabled={plusDisabled}
          onClick={onPlus}
        >
          +
        </button>
      </span>
    </Field>
  )
}

/**
 * Client field with live suggestions: type part of the name or the phone,
 * pick a match, it goes into the order. The orange «+» beside it creates a
 * client that is not in the list yet.
 */
export function ClientPicker({
  clients,
  value,
  onSelect,
  onAdd,
}: {
  clients: { id: string; fullName: string; phone: string; children: { name: string }[] }[]
  /** Selected client id, or '' when nothing is chosen. */
  value: string
  onSelect: (id: string) => void
  onAdd: () => void
}) {
  const selected = clients.find((c) => c.id === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  // Clicking anywhere else puts the field back to showing the chosen client.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const raw = query.trim().toLowerCase()
  const short = raw.length > 0 && raw.length < MIN_SEARCH
  const q = raw.length >= MIN_SEARCH ? raw : ''
  const matches = q
    ? clients
        .filter((c) => {
          if (c.fullName.toLowerCase().includes(q)) return true
          if (c.children.some((ch) => ch.name.toLowerCase().includes(q))) return true
          const d = digitsOnly(q)
          return d.length > 0 && digitsOnly(c.phone).includes(d)
        })
        .slice(0, 8)
    : []

  const choose = (id: string) => {
    onSelect(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="field-col" ref={box} style={{ position: 'relative' }}>
      Клиент
      <span className="field-plus">
        <input
          className="input"
          type="text"
          placeholder="ФИО родителя, имя ребёнка или телефон"
          value={open ? query : (selected?.fullName ?? '')}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onChange={(e) => {
            setQuery(onlyCyrillic(e.target.value))
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
            if (e.key === 'Enter' && matches[0]) {
              e.preventDefault()
              choose(matches[0].id)
            }
          }}
        />
        <button type="button" aria-label="Добавить клиента" title="Добавить клиента" onClick={onAdd}>
          +
        </button>
      </span>

      {open && (
        <div className="picker">
          {(raw.length === 0 || short) && (
            <div className="picker-empty">
              Введите не менее {MIN_SEARCH} символов — ФИО родителя, имя ребёнка или телефон
            </div>
          )}
          {matches.map((c) => (
            <button key={c.id} type="button" className="picker-row" onClick={() => choose(c.id)}>
              <span className="picker-name">{c.fullName}</span>
              <span className="picker-meta">
                {formatPhone(c.phone)}
                {c.children.length > 0 && ` · ${c.children.map((ch) => ch.name).join(', ')}`}
              </span>
            </button>
          ))}
          {q !== '' && matches.length === 0 && (
            <div className="picker-empty">
              Никого не нашли — нажмите «+», чтобы завести карточку
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Переводит фокус на следующее поле формы — слева направо, затем на
 * следующую строку. Порядок берётся из самой разметки, поэтому совпадает с
 * тем, что видит глаз.
 */
function focusNext(from: HTMLElement): void {
  const form = from.closest('.modal-main, form, .page')
  if (!form) return
  const fields = Array.from(
    form.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])'),
  ).filter((el) => el.offsetParent !== null)
  const i = fields.indexOf(from)
  const next = i >= 0 ? fields[i + 1] : undefined
  if (!next) return
  next.focus()
  // После programmatic focus каретка встаёт в начало строки, и следующий
  // символ вписывается перед уже набранными — цифры шли задом наперёд.
  if (next instanceof HTMLInputElement && next.type === 'text') {
    const end = next.value.length
    next.setSelectionRange(end, end)
  }
}

/** Дата в формате дд.мм.гггг: точки расставляются сами, набираются только
 *  цифры. Как только дата заполнена, фокус уходит на следующее поле. */
export function DateField({
  label,
  value,
  onChange,
  className = '',
  error,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  className?: string
  error?: string
}) {
  return (
    <Field label={label} className={className} error={error}>
      <input
        className={error ? 'input invalid' : 'input'}
        type="text"
        inputMode="numeric"
        placeholder="дд.мм.гггг"
        maxLength={10}
        value={value}
        disabled={!onChange}
        onChange={(e) => {
          const next = maskDate(e.target.value)
          onChange?.(next)
          if (isDateComplete(next)) focusNext(e.target)
        }}
      />
    </Field>
  )
}

/** Телефон — десять цифр без +7 и 8. Заполнился — фокус дальше. */
export function PhoneField({
  label,
  value,
  onChange,
  className = '',
  error,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  className?: string
  error?: string
}) {
  return (
    <Field label={label} className={className} error={error}>
      <input
        className={error ? 'input invalid' : 'input'}
        type="text"
        inputMode="numeric"
        placeholder="+7 (___) ___-__-__"
        maxLength={18}
        // На экране маска, в данных — те же 10 цифр, что и раньше.
        value={formatPhone(value)}
        disabled={!onChange}
        onChange={(e) => {
          const next = maskPhone(e.target.value)
          onChange?.(next)
          if (isPhoneComplete(next)) focusNext(e.target)
        }}
      />
    </Field>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: () => void
  children?: ReactNode
}) {
  return (
    <span
      className={`check${checked ? ' on' : ''}`}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onChange()
        }
      }}
      style={children ? undefined : { gap: 0 }}
    >
      <span className="box">{checked && <Check style={{ width: 12, height: 12 }} />}</span>
      {children}
    </span>
  )
}

/* ===== Segmented pill choice ===== */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  equal,
}: {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (v: T) => void
  /** Stretch the options to equal widths — the payment-method row. */
  equal?: boolean
}) {
  return (
    <div className={`seg${equal ? ' equal' : ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`pill-btn${o.value === value ? ' on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ===== Status pill ===== */

export type PillTone = 'success' | 'warn' | 'danger' | 'info' | 'progress' | 'neutral'

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  if (tone === 'neutral') {
    return (
      <span className="pill" style={{ background: 'var(--owls-stone)', color: 'var(--fg-2)' }}>
        {children}
      </span>
    )
  }
  return <span className={`pill pill-${tone}`}>{children}</span>
}

/* ===== Search bar with the orange «+» ===== */

export interface Suggestion {
  id: string
  title: string
  meta: string
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  onPlus,
  plusLabel,
  suggestions,
  onPick,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  onPlus?: () => void
  plusLabel?: string
  /** Клиенты, подходящие под запрос — показываются списком под полем. */
  suggestions?: Suggestion[]
  onPick?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const list = suggestions ?? []
  const showList = open && list.length > 0

  return (
    <div className="search-wrap" ref={box}>
      <Search className="search-icon" />
      <input
        className="input"
        type="text"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(onlyCyrillic(e.target.value))
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {onPlus && (
        <button type="button" className="search-plus" aria-label={plusLabel} title={plusLabel} onClick={onPlus}>
          +
        </button>
      )}

      {showList && (
        <div className="picker">
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              className="picker-row"
              onClick={() => {
                setOpen(false)
                onPick?.(s.id)
              }}
            >
              <span className="picker-name">{s.title}</span>
              <span className="picker-meta">{s.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===== Sub tabs ===== */

export interface SubTab {
  id: string
  label: string
  badge?: number
  /** The active tab's badge is stone rather than orange. */
  neutralBadge?: boolean
}

export function SubTabs({
  tabs,
  active,
  onChange,
  className = '',
  style,
}: {
  tabs: SubTab[]
  active: string
  onChange: (id: string) => void
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`subtabs ${className}`} style={style}>
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            className={`subtab${isActive ? ' active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className="tab-badge"
                style={
                  isActive ? { background: 'var(--owls-stone)', color: 'var(--fg-2)' } : undefined
                }
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ===== Right-column cards ===== */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardRow({
  label,
  value,
  tone,
}: {
  label: ReactNode
  value: ReactNode
  tone?: 'neg' | 'accent' | 'muted'
}) {
  return (
    <div className="card-row">
      <span>{label}</span>
      <span className={tone === 'muted' ? '' : (tone ?? '')} style={tone === 'muted' ? { color: 'var(--fg-3)' } : undefined}>
        {value}
      </span>
    </div>
  )
}

export function CardTotal({
  label,
  value,
  tone,
  small,
}: {
  label: string
  value: ReactNode
  tone?: 'neg' | 'accent'
  small?: boolean
}) {
  return (
    <>
      <div className="card-rule" />
      <div className={`card-total${small ? ' sm' : ''}`}>
        <span>{label}</span>
        <span className={tone ?? ''}>{value}</span>
      </div>
    </>
  )
}

export function CardKicker({ children }: { children: ReactNode }) {
  return <div className="card-kicker">{children}</div>
}

export function CardNote({ children }: { children: ReactNode }) {
  return <div className="card-note">{children}</div>
}

/* ===== KPI tile ===== */

export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: ReactNode
  note?: ReactNode
  tone?: 'neg'
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone ?? ''}`}>{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  )
}

/* ===== Catalog row with the − qty + stepper ===== */

export function CatalogRow({
  name,
  meta,
  qty,
  onChange,
}: {
  name: string
  meta: string
  qty: number
  /** Без обработчика строка только показывает количество — так выглядит
   *  заказ у того, кому не дано право менять состав. */
  onChange?: (qty: number) => void
}) {
  return (
    <div className="cat-row">
      <div style={{ flex: 1 }}>
        <div className="cat-name">{name}</div>
        <div className="cat-meta">{meta}</div>
      </div>
      <div className="stepper">
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          aria-label="Уменьшить"
          disabled={!onChange}
          onClick={() => onChange?.(Math.max(0, qty - 1))}
        >
          −
        </button>
        <span>{qty}</span>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          aria-label="Увеличить"
          disabled={!onChange}
          onClick={() => onChange?.(qty + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

/* ===== Table helpers ===== */

export function SortableTh({ children }: { children: ReactNode }) {
  return (
    <span className="col-h">
      {children}
      <ChevronsUpDown />
    </span>
  )
}

export function ListFoot({
  note,
  onMore,
  moreLabel = 'Показать ещё',
  children,
}: {
  note: ReactNode
  onMore?: () => void
  moreLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="list-foot">
      <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{note}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {children}
        {onMore && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onMore}>
            <ArrowDown />
            {moreLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle: ReactNode; actions?: ReactNode }) {
  if (!actions) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div className="h1" style={{ fontSize: 28 }}>
          {title}
        </div>
        <p className="subtitle" style={{ margin: 0 }}>
          {subtitle}
        </p>
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 20,
      }}
    >
      <div>
        <div className="h1" style={{ fontSize: 28 }}>
          {title}
        </div>
        <p className="subtitle" style={{ margin: 0 }}>
          {subtitle}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  )
}
