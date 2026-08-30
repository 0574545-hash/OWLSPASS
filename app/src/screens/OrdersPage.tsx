import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Page } from '../components/AppShell'
import { ListFoot, PageHead, Pill, SearchBar, SortableTh, SubTabs } from '../components/ui'
import { DASH, MIN_SEARCH, clock, digitsOnly, duration, money, percent, plural, searchQuery } from '../lib/format'
import { OVERTIME_RATE, elapsed, endTime, paymentLabel, statusLabel, statusTone } from '../domain/rules'
import { clientOf, tariffDuration, totalsOf, useStore, type AppState } from '../state/store'
import type { Order } from '../domain/types'

const PAGE = 18

/** Screen 04 — «Заказы»: search, tabs, and the shift's order list.
 *  Colour reads off payment: green paid, yellow unpaid, red unpaid and
 *  over the tariff's time. */
export function OrdersPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [limit, setLimit] = useState(PAGE)

  // Rows are built outside the selector: a selector that returns fresh
  // objects can never produce a stable store snapshot.
  const state = useStore((s) => s)
  const rows = useMemo(() => state.orders.map((o) => buildRow(state, o)), [state])
  const shift = state.shift

  const counts = {
    all: rows.length,
    open: rows.filter((r) => r.status === 'open').length,
    unpaid: rows.filter((r) => r.remainder > 0).length,
    closed: rows.filter((r) => r.status === 'closed').length,
  }

  const filtered = rows
    .filter((r) => {
      if (tab === 'open') return r.status === 'open'
      if (tab === 'unpaid') return r.remainder > 0
      if (tab === 'closed') return r.status === 'closed'
      return true
    })
    .filter((r) => {
      const q = searchQuery(query)
      if (!q) return true
      if (String(r.no).includes(q)) return true
      if (r.client.toLowerCase().includes(q)) return true
      if (r.children.toLowerCase().includes(q)) return true
      const d = digitsOnly(q)
      return d.length > 0 && digitsOnly(r.phone).includes(d)
    })

  const shown = filtered.slice(0, limit)

  return (
    <Page>
      <PageHead
        title="Заказы"
        subtitle={`${shift.date} · ${counts.all} ${plural(counts.all, 'заказ', 'заказа', 'заказов')} за смену · ${counts.unpaid} не ${plural(counts.unpaid, 'оплачен', 'оплачено', 'оплачено')}`}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Поиск по номеру заказа, ФИО родителя, имени ребёнка или телефону"
          onPlus={() => navigate('/clients/new')}
          plusLabel="Добавить клиента"
        />
        <button className="btn btn-primary" type="button" onClick={() => navigate('/orders/new')}>
          <Plus />
          Создать заказ
        </button>
      </div>

      <SubTabs
        active={tab}
        onChange={(id) => {
          setTab(id)
          setLimit(PAGE)
        }}
        style={{ marginBottom: 16 }}
        tabs={[
          { id: 'all', label: 'Все', badge: counts.all },
          { id: 'open', label: 'Открытые', badge: counts.open },
          { id: 'unpaid', label: 'Не оплачены', badge: counts.unpaid },
          { id: 'closed', label: 'Закрытые', badge: counts.closed },
        ]}
      />

      <div className="surface" data-compact="" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 76 }}>
                  <SortableTh>Заказ</SortableTh>
                </th>
                <th style={{ width: 76 }}>
                  <SortableTh>Создан</SortableTh>
                </th>
                <th style={{ width: 84 }}>Окончание</th>
                <th style={{ width: 76 }}>Прошло</th>
                <th style={{ width: 80 }}>Доплата</th>
                <th style={{ width: 230 }}>Клиент</th>
                <th style={{ width: 180 }}>Тариф</th>
                <th style={{ width: 120 }}>Оплата</th>
                <th style={{ width: 84 }}>Скидка</th>
                <th style={{ width: 96 }}>Сумма</th>
                <th style={{ width: 104 }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="row-click" onClick={() => navigate(`/orders/${r.no}`)}>
                  <td className="mono">№ {r.no}</td>
                  <td className="mono">{clock(r.createdAt)}</td>
                  <td className="mono">{clock(r.endAt)}</td>
                  <td className="mono">{duration(r.elapsed)}</td>
                  <td
                    className="mono"
                    style={
                      r.overtime > 0
                        ? { color: 'var(--owls-orange)', fontWeight: 700 }
                        : { color: 'var(--fg-3)' }
                    }
                  >
                    {r.overtime > 0 ? `+${money(r.overtime)}` : DASH}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.client}</div>
                    {r.children && (
                      <div className="muted" style={{ fontSize: 12 }}>
                        {r.children}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{r.tariff}</div>
                  </td>
                  <td>{r.payment}</td>
                  <td className="mono" style={r.discount === 0 ? { color: 'var(--fg-3)' } : undefined}>
                    {percent(r.discount)}
                  </td>
                  <td style={{ fontWeight: 700 }}>{money(r.sum)}</td>
                  <td>
                    <Pill tone={r.tone}>{r.statusLabel}</Pill>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={11} className="empty">
                    <EmptyResult query={query} tab={tab} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ListFoot
          note={`Загружено ${Math.min(limit, filtered.length)} из ${filtered.length} · при закрытии заказа время сверх тарифа начисляется автоматически по ${OVERTIME_RATE} за час`}
          onMore={limit < filtered.length ? () => setLimit(limit + PAGE) : undefined}
        />
      </div>
    </Page>
  )
}

/** Пустой результат объясняет, почему пусто: слишком короткий запрос, клиент
 *  без заказов или просто нет совпадений. */
function EmptyResult({ query, tab }: { query: string; tab: string }) {
  const navigate = useNavigate()
  const raw = query.trim()
  const q = searchQuery(query)
  const clients = useStore((s) => s.clients)

  if (raw.length > 0 && q === '') {
    return <>Введите не менее {MIN_SEARCH} символов</>
  }

  // Клиент в базе есть, а заказов у него нет — это самый частый случай, и
  // «ничего не найдено» тут сбивает с толку.
  const found = q
    ? clients.find(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.children.some((ch) => ch.name.toLowerCase().includes(q)) ||
          (digitsOnly(q).length > 0 && digitsOnly(c.phone).includes(digitsOnly(q))),
      )
    : undefined

  if (found) {
    return (
      <>
        У клиента «{found.fullName}» нет заказов
        {tab !== 'all' && ' на этой вкладке'}.{' '}
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          style={{ marginLeft: 6 }}
          onClick={() => navigate('/orders/new')}
        >
          Создать заказ
        </button>
      </>
    )
  }

  return <>Ничего не найдено — измените запрос или выберите другую вкладку</>
}

export interface OrderRow {
  id: string
  no: number
  createdAt: number
  endAt: number
  elapsed: number
  overtime: number
  client: string
  phone: string
  children: string
  tariff: string
  payment: string
  discount: number
  sum: number
  remainder: number
  status: Order['status']
  statusLabel: string
  tone: 'success' | 'warn' | 'danger'
}

export function buildRow(s: AppState, order: Order): OrderRow {
  const client = clientOf(s, order.clientId)
  const dur = tariffDuration(order.tariffItemId)
  const totals = totalsOf(s, order)
  const childNames = order.childIds
    .map((id) => client?.children.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => `${c!.name}, ${ageOf(c!.birthDate)}`)
    .join(' · ')

  return {
    id: order.id,
    no: order.no,
    createdAt: order.createdAt,
    endAt: endTime(order, dur),
    elapsed: elapsed(order, dur),
    overtime: totals.overtime,
    client: client?.fullName ?? '—',
    phone: client?.phone ?? '',
    children: childNames,
    tariff: order.tariffLabel,
    payment: paymentLabel(order, totals),
    discount: client?.discountPct ?? 0,
    // The column shows what the order is worth after discounts, before the
    // time surcharge — the surcharge has a column of its own.
    sum: Math.max(0, totals.items - totals.discount - totals.manualDiscount),
    remainder: totals.remainder,
    status: order.status,
    statusLabel: statusLabel(order),
    tone: statusTone(order, client, dur),
  }
}

/** «02.05.2020» → age in whole years at the shift date. */
export function ageOf(birthDate: string): number {
  const [d, m, y] = birthDate.split('.').map(Number)
  if (!d || !m || !y) return 0
  const shift = new Date(2026, 7, 30)
  const born = new Date(y, m - 1, d)
  let age = shift.getFullYear() - born.getFullYear()
  const before =
    shift.getMonth() < born.getMonth() ||
    (shift.getMonth() === born.getMonth() && shift.getDate() < born.getDate())
  if (before) age -= 1
  return Math.max(0, age)
}
