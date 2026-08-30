import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpFromLine, Plus, UserPlus } from 'lucide-react'
import { Page } from '../components/AppShell'
import { Stat } from '../components/ui'
import { counted, money, plural } from '../lib/format'
import {
  cashSummary,
  clientOf,
  debtSummary,
  openOrders,
  totalsOf,
  unpaidOrders,
  useStore,
} from '../state/store'

/** Screen 03 — «Главная»: state of the shift, the day's figures and the
 *  quick-access buttons. */
export function HomePage() {
  const navigate = useNavigate()
  const shift = useStore((s) => s.shift)
  const summary = useStore(cashSummary)
  const debt = useStore(debtSummary)
  const open = useStore(openOrders)
  const unpaid = useStore((s) => unpaidOrders(s).length)

  // «Детей в зале» — children on orders whose visit has not finished yet.
  const inHall = useStore((s) =>
    openOrders(s)
      .filter((o) => o.endedAt === undefined)
      .reduce((sum, o) => sum + Math.max(1, o.childIds.length), 0),
  )
  const capacity = 45

  // Built outside the selector so the store snapshot stays stable.
  const state = useStore((s) => s)
  const attention = useMemo(
    () =>
      unpaidOrders(state)
        .slice(0, 5)
        .map((o) => ({
          no: o.no,
          id: o.id,
          client: clientOf(state, o.clientId)?.fullName ?? '—',
          remainder: totalsOf(state, o).remainder,
        })),
    [state],
  )

  return (
    <Page>
      <div style={{ marginBottom: 20 }}>
        <div className="h1" style={{ fontSize: 28 }}>
          Смена {shift.date.slice(0, 2)} августа
        </div>
        <p className="subtitle" style={{ margin: 0 }}>
          Суббота · открыта в {shift.openedAt / 60 === 9 ? '09:00' : ''} · администратор {shift.admin},
          кассир {shift.cashier}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        <button className="btn btn-primary" type="button" onClick={() => navigate('/orders/new')}>
          <Plus />
          Создать заказ
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => navigate('/clients/new')}>
          <UserPlus />
          Добавить клиента
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => navigate('/cash/collect')}>
          <ArrowUpFromLine />
          Инкассация
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <Stat
          label="Выручка за смену"
          value={money(summary.revenue)}
          note={counted(summary.ops, 'операция', 'операции', 'операций')}
        />
        <Stat
          label="Детей в зале"
          value={`${inHall} из ${capacity}`}
          note={`свободно ${capacity - inHall} ${plural(capacity - inHall, 'место', 'места', 'мест')}`}
        />
        <Stat
          label="Открытых заказов"
          value={open.length}
          note={`${unpaid} не ${plural(unpaid, 'оплачен', 'оплачено', 'оплачено')}`}
        />
        <Stat
          label="Задолженность"
          value={money(debt.total)}
          tone="neg"
          note={counted(debt.clients, 'клиент', 'клиента', 'клиентов')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start', minHeight: 0, flex: 1 }}>
        <div className="surface" data-compact="" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-1)' }}>
            <div className="card-kicker">Открытые заказы</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Заказ</th>
                  <th>Клиент</th>
                  <th style={{ width: 200 }}>Тариф</th>
                  <th style={{ width: 120 }}>Остаток</th>
                </tr>
              </thead>
              <tbody>
                {open.map((o) => (
                  <OpenRow key={o.id} id={o.id} no={o.no} />
                ))}
                {open.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">
                      Открытых заказов нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-kicker">Требует внимания</div>
            {attention.length === 0 && <div className="card-note">Всё оплачено</div>}
            {attention.map((a) => (
              <button
                key={a.id}
                type="button"
                className="card-row"
                onClick={() => navigate(`/orders/${a.no}`)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
              >
                <span>
                  № {a.no} · {a.client}
                </span>
                <span className="neg">{money(a.remainder)}</span>
              </button>
            ))}
          </div>

          <div className="card">
            <div className="card-kicker">Сводка по смене</div>
            <div className="card-row">
              <span>Наличные в кассе</span>
              <span>{money(summary.cashOnHand)}</span>
            </div>
            <div className="card-row">
              <span>Безнал</span>
              <span>{money(summary.cashless)}</span>
            </div>
            <div className="card-row">
              <span>Возвраты</span>
              <span className="neg">{money(-summary.refunds)}</span>
            </div>
            <div className="card-row">
              <span>Средний чек</span>
              <span>{money(summary.avgCheck)}</span>
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}

function OpenRow({ id, no }: { id: string; no: number }) {
  const navigate = useNavigate()
  const row = useStore((s) => {
    const order = s.orders.find((o) => o.id === id)!
    return {
      client: clientOf(s, order.clientId)?.fullName ?? '—',
      tariff: order.tariffLabel,
      remainder: totalsOf(s, order).remainder,
    }
  })
  return (
    <tr className="row-click" onClick={() => navigate(`/orders/${no}`)}>
      <td className="mono">№ {no}</td>
      <td>
        <div style={{ fontWeight: 600 }}>{row.client}</div>
      </td>
      <td>{row.tariff}</td>
      <td style={{ fontWeight: 700 }} className={row.remainder > 0 ? 'neg' : ''}>
        {row.remainder > 0 ? money(row.remainder) : '—'}
      </td>
    </tr>
  )
}
