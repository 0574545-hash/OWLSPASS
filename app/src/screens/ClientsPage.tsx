import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/AppShell'
import { ListFoot, PageHead, SearchBar, SortableTh, SubTabs } from '../components/ui'
import { DASH, MIN_SEARCH, digitsOnly, money, percent, plural, searchQuery } from '../lib/format'
import { clientBalance, debtSummary, useCan, useStore } from '../state/store'
import { ageOf } from './OrdersPage'

const PAGE = 18

/** Screen 09 — «Клиенты»: search by parent, child or phone. */
export function ClientsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [limit, setLimit] = useState(PAGE)

  // Built outside the selector so the store snapshot stays stable.
  const state = useStore((s) => s)
  const rows = useMemo(
    () =>
      state.clients.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        children: c.children.map((ch) => `${ch.name}, ${ageOf(ch.birthDate)}`).join(' · '),
        childNames: c.children.map((ch) => ch.name).join(' '),
        discountPct: c.discountPct,
        lastVisit: c.lastVisit,
        balance: clientBalance(state, c.id),
        birthdaySoon: c.children.some((ch) => birthdayWithinWeek(ch.birthDate)),
      })),
    [state],
  )
  const debt = debtSummary(state)

  const counts = {
    all: rows.length,
    discount: rows.filter((r) => r.discountPct > 0).length,
    debt: rows.filter((r) => r.balance < 0).length,
    birthdays: rows.filter((r) => r.birthdaySoon).length,
  }

  const filtered = rows
    .filter((r) => {
      if (tab === 'discount') return r.discountPct > 0
      if (tab === 'debt') return r.balance < 0
      if (tab === 'birthdays') return r.birthdaySoon
      return true
    })
    .filter((r) => {
      const q = searchQuery(query)
      if (!q) return true
      if (r.fullName.toLowerCase().includes(q)) return true
      if (r.childNames.toLowerCase().includes(q)) return true
      const d = digitsOnly(q)
      return d.length > 0 && digitsOnly(r.phone).includes(d)
    })

  const mayCreate = useCan('clients.create')
  const shown = filtered.slice(0, limit)

  return (
    <Page>
      <PageHead
        title="Клиенты"
        subtitle={`${counts.all} ${plural(counts.all, 'карточка', 'карточки', 'карточек')} · ${debt.clients} с задолженностью`}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Поиск по ФИО родителя, имени ребёнка или телефону"
          onPlus={mayCreate ? () => navigate('/clients/new') : undefined}
          plusLabel="Добавить клиента"
        />
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
          { id: 'discount', label: 'Со скидкой', badge: counts.discount },
          { id: 'debt', label: 'Задолженность', badge: counts.debt },
          { id: 'birthdays', label: 'Дни рождения', badge: counts.birthdays },
        ]}
      />

      <div className="surface" data-compact="" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 230 }}>
                  <SortableTh>ФИО родителя</SortableTh>
                </th>
                <th style={{ width: 150 }}>Телефон</th>
                <th style={{ width: 180 }}>Дети</th>
                <th style={{ width: 100 }}>Скидка</th>
                <th style={{ width: 118 }}>
                  <SortableTh>Визит</SortableTh>
                </th>
                <th style={{ width: 118 }}>Баланс</th>
                <th style={{ width: 88 }} />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="row-click" onClick={() => navigate(`/clients/${r.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                  </td>
                  <td className="mono">{r.phone}</td>
                  <td>{r.children || DASH}</td>
                  <td>{percent(r.discountPct)}</td>
                  <td className="mono">{r.lastVisit}</td>
                  <td style={{ fontWeight: 700 }} className={r.balance < 0 ? 'neg' : ''}>
                    {money(r.balance)}
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/clients/${r.id}`)
                        }}
                      >
                        Открыть
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    {query.trim().length > 0 && searchQuery(query) === ''
                      ? `Введите не менее ${MIN_SEARCH} символов`
                      : 'Ничего не найдено — измените запрос или создайте карточку кнопкой «+»'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ListFoot
          note={`Загружено ${Math.min(limit, filtered.length)} из ${filtered.length} · остальные подгружаются при прокрутке`}
          onMore={limit < filtered.length ? () => setLimit(limit + PAGE) : undefined}
        />
      </div>
    </Page>
  )
}

/** A birthday inside the next seven days of the shift date. */
function birthdayWithinWeek(birthDate: string): boolean {
  const [d, m] = birthDate.split('.').map(Number)
  if (!d || !m) return false
  const shift = new Date(2026, 7, 30)
  const next = new Date(2026, m - 1, d)
  if (next < shift) next.setFullYear(2027)
  const days = (next.getTime() - shift.getTime()) / 86_400_000
  return days >= 0 && days <= 7
}
