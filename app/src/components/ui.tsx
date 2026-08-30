import type { ChangeEvent, ReactNode } from 'react'
import { ArrowDown, Check, ChevronsUpDown, Search } from 'lucide-react'
import { money } from '../lib/format'

/* ===== Form fields ===== */

export function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`field-col ${className}`}>
      {label}
      {children}
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
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}) {
  return (
    <Field label={label} className={className}>
      <input
        className="input"
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled || !onChange}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
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
}: {
  label: string
  value: number
  onChange?: (v: number) => void
  disabled?: boolean
}) {
  return (
    <Field label={label}>
      <input
        className="input"
        type="text"
        inputMode="numeric"
        value={money(value)}
        disabled={disabled || !onChange}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '')
          onChange?.(digits === '' ? 0 : Number(digits))
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
        onChange={(e) => onChange?.(e.target.value)}
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
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  onPlus: () => void
  plusLabel: string
  options?: string[]
}) {
  return (
    <Field label={label}>
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
            className="input"
            type="text"
            value={value}
            disabled={!onChange}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}
        <button type="button" aria-label={plusLabel} title={plusLabel} onClick={onPlus}>
          +
        </button>
      </span>
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

export function SearchBar({
  value,
  onChange,
  placeholder,
  onPlus,
  plusLabel,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  onPlus?: () => void
  plusLabel?: string
}) {
  return (
    <div className="search-wrap">
      <Search className="search-icon" />
      <input
        className="input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {onPlus && (
        <button type="button" className="search-plus" aria-label={plusLabel} title={plusLabel} onClick={onPlus}>
          +
        </button>
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
  onChange: (qty: number) => void
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
          onClick={() => onChange(Math.max(0, qty - 1))}
        >
          −
        </button>
        <span>{qty}</span>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          aria-label="Увеличить"
          onClick={() => onChange(qty + 1)}
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
