import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Lock } from 'lucide-react'
import { Page } from '../components/AppShell'
import { ListFoot, PageHead, Pill, SortableTh, Stat, SubTabs } from '../components/ui'
import { DASH, clock, counted, money, plural } from '../lib/format'
import { cashJournal, cashSummary, useCan, useStore } from '../state/store'

const PAGE = 12

/** Screens 12 and 15 — «Касса»: the day's journal and the history of shifts. */
export function CashPage() {
  const { tab: routeTab } = useParams()
  const tab = routeTab === 'shifts' ? 'shifts' : 'ops'
  return tab === 'shifts' ? <ShiftsTab /> : <OpsTab />
}

function OpsTab() {
  const navigate = useNavigate()
  const [limit, setLimit] = useState(PAGE)
  const ops = useStore(cashJournal)
  const summary = useStore(cashSummary)
  const shift = useStore((s) => s.shift)
  const shiftsCount = useStore((s) => s.shifts.length + (s.shift.closedAt ? 0 : 1))
  const mayDeposit = useCan('cash.deposit')
  const mayCollect = useCan('cash.collect')
  const mayCloseShift = useCan('shift.close')
  const mayShifts = useCan('cash.shifts')
  const mayReceipt = useCan('cash.receipt')

  const shown = ops.slice(0, limit)

  return (
    <Page>
      <PageHead
        title="Касса"
        subtitle={`Смена № ${shift.no} · открыта ${shift.date} в ${clock(shift.openedAt)} · кассир ${shift.cashier}`}
        actions={
          <>
            {mayDeposit && (
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/cash/deposit')}>
                <ArrowDownToLine />
                Внести
              </button>
            )}
            {mayCollect && (
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/cash/collect')}>
                <ArrowUpFromLine />
                Изъятие
              </button>
            )}
            {mayCloseShift && (
              <button className="btn btn-primary" type="button" onClick={() => navigate('/cash/close')}>
                <Lock />
                Закрыть смену
              </button>
            )}
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '0 0 20px' }}>
        <Stat label="Наличные в кассе" value={money(summary.cashOnHand)} note="после инкассации" />
        <Stat label="Безнал за смену" value={money(summary.cashless)} note="карта и СБП" />
        <Stat
          label="Средний чек"
          value={money(summary.avgCheck)}
          note={counted(summary.payments, 'оплата', 'оплаты', 'оплат')}
        />
      </div>

      <SubTabs
        active="ops"
        onChange={(id) => navigate(id === 'shifts' ? '/cash/shifts' : '/cash')}
        style={{ marginBottom: 20 }}
        tabs={
          mayShifts
            ? [
                { id: 'ops', label: 'Операции', badge: summary.ops },
                { id: 'shifts', label: 'Смены', badge: shiftsCount },
              ]
            : [{ id: 'ops', label: 'Операции', badge: summary.ops }]
        }
      />

      <div className="surface" data-compact="" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 110 }}>
                  <SortableTh>Время</SortableTh>
                </th>
                <th style={{ width: 110 }}>Заказ</th>
                <th style={{ width: 250 }}>Клиент</th>
                <th style={{ width: 170 }}>Операция</th>
                <th style={{ width: 150 }}>Способ</th>
                <th style={{ width: 140 }}>Сумма</th>
                <th style={{ width: 150 }}>Кассир</th>
                <th style={{ width: 88 }} />
              </tr>
            </thead>
            <tbody>
              {shown.map((op) => {
                const unpaid = op.kind === 'Не оплачено'
                const negative = op.amount < 0
                return (
                  <tr key={op.id}>
                    <td className="mono">{clock(op.at)}</td>
                    <td className="mono">{op.orderNo ? `№ ${op.orderNo}` : DASH}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{op.subject}</div>
                    </td>
                    <td>{unpaid ? 'Оплата заказа' : op.kind}</td>
                    <td>{op.method}</td>
                    <td style={{ fontWeight: 700 }} className={negative || unpaid ? 'neg' : ''}>
                      {money(op.amount)}
                    </td>
                    <td>{op.cashier}</td>
                    <td>
                      <div className="cell-actions">
                        {unpaid && op.orderNo ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => navigate(`/orders/${op.orderNo}/pay`)}
                          >
                            Оплатить
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            disabled={op.orderNo === undefined || !mayReceipt}
                            title={
                              !mayReceipt
                                ? 'Нет права «Чек и акт по операции»'
                                : op.orderNo === undefined
                                  ? 'Операция не привязана к заказу'
                                  : 'Посмотреть параметры заказа'
                            }
                            onClick={() => op.orderNo && navigate(`/orders/${op.orderNo}/view`)}
                          >
                            {op.kind === 'Возврат' ? 'Акт' : 'Чек'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    Операций пока нет — внесите деньги в кассу или создайте заказ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ListFoot
          note={`Показаны ${Math.min(limit, ops.length)} из ${ops.length} · остальные подгружаются при прокрутке`}
          onMore={limit < ops.length ? () => setLimit(limit + PAGE) : undefined}
        />
      </div>
    </Page>
  )
}

function ShiftsTab() {
  const navigate = useNavigate()
  const [limit, setLimit] = useState(17)
  const past = useStore((s) => s.shifts)
  const shift = useStore((s) => s.shift)
  const summary = useStore(cashSummary)
  const opsCount = useStore((s) => cashSummary(s).ops)
  const mayCloseShift = useCan('shift.close')

  const current =
    shift.closedAt === undefined
      ? [
          {
            no: shift.no,
            date: shift.date,
            openedAt: shift.openedAt,
            closedAt: undefined as number | undefined,
            cashier: shift.cashier,
            ops: opsCount,
            cash: summary.cashOnHand,
            cashless: summary.cashless,
            discrepancy: 0,
            status: 'open' as const,
          },
        ]
      : []

  const rows = [...current, ...past]
  const shown = rows.slice(0, limit)

  const monthRevenue = rows.reduce((s, r) => s + r.cash + r.cashless, 0)
  const discrepancies = rows.filter((r) => r.discrepancy !== 0)
  const discrepancyTotal = discrepancies.reduce((s, r) => s + r.discrepancy, 0)
  const avgOps = Math.round(rows.reduce((s, r) => s + r.ops, 0) / Math.max(1, rows.length))

  return (
    <Page>
      <PageHead
        title="Касса"
        subtitle={`Смены · август 2026 · ${rows.length} ${plural(rows.length, 'смена', 'смены', 'смен')}, ${discrepancies.length} с расхождением`}
        actions={
          mayCloseShift ? (
            <button className="btn btn-primary" type="button" onClick={() => navigate('/cash/close')}>
              <Lock />
              Закрыть смену
            </button>
          ) : null
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '0 0 20px' }}>
        <Stat
          label="Выручка за месяц"
          value={money(monthRevenue)}
          note={counted(rows.length, 'смена', 'смены', 'смен')}
        />
        <Stat
          label="Средняя смена"
          value={money(Math.round(monthRevenue / Math.max(1, rows.length)))}
          note={`${avgOps} ${plural(avgOps, 'операция', 'операции', 'операций')} в среднем`}
        />
        <Stat
          label="Расхождения"
          value={money(discrepancyTotal)}
          tone="neg"
          note={`${discrepancies.length} ${plural(discrepancies.length, 'смена', 'смены', 'смен')} из ${rows.length}`}
        />
      </div>

      <SubTabs
        active="shifts"
        onChange={(id) => navigate(id === 'shifts' ? '/cash/shifts' : '/cash')}
        style={{ marginBottom: 20 }}
        tabs={[
          { id: 'ops', label: 'Операции', badge: opsCount },
          { id: 'shifts', label: 'Смены', badge: rows.length },
        ]}
      />

      <div className="surface" data-compact="" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 100 }}>
                  <SortableTh>Смена</SortableTh>
                </th>
                <th style={{ width: 120 }}>Дата</th>
                <th style={{ width: 150 }}>Открыта — закрыта</th>
                <th style={{ width: 180 }}>Кассир</th>
                <th style={{ width: 100 }}>Операций</th>
                <th style={{ width: 130 }}>Наличные</th>
                <th style={{ width: 130 }}>Безнал</th>
                <th style={{ width: 130 }}>Расхождение</th>
                <th style={{ width: 130 }}>Статус</th>
                <th style={{ width: 88 }} />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.no}>
                  <td className="mono">№ {r.no}</td>
                  <td className="mono">{r.date}</td>
                  <td className="mono">
                    {clock(r.openedAt)} — {r.closedAt !== undefined ? clock(r.closedAt) : '…'}
                  </td>
                  <td>{r.cashier}</td>
                  <td>{r.ops}</td>
                  <td style={{ fontWeight: 700 }}>{money(r.cash)}</td>
                  <td style={{ fontWeight: 700 }}>{money(r.cashless)}</td>
                  <td className={r.discrepancy < 0 ? 'neg' : ''}>
                    {r.status === 'open' ? DASH : r.discrepancy === 0 ? '0' : money(r.discrepancy)}
                  </td>
                  <td>
                    {r.status === 'open' ? (
                      <Pill tone="progress">Открыта</Pill>
                    ) : r.status === 'discrepancy' ? (
                      <Pill tone="danger">Расхождение</Pill>
                    ) : (
                      <Pill tone="success">Закрыта</Pill>
                    )}
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/cash')}>
                        Открыть
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListFoot
          note={`Загружено ${Math.min(limit, rows.length)} из ${rows.length} · остальные подгружаются при прокрутке`}
          onMore={limit < rows.length ? () => setLimit(limit + 14) : undefined}
        />
      </div>
    </Page>
  )
}
