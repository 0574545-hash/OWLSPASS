import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, Checkbox, SelectField, SubTabs } from '../components/ui'
import { DASH, money } from '../lib/format'
import { actions, cashSummary, clientOf, currentUser, shiftClosed, totalsOf, useStore } from '../state/store'
import type { PaymentMethod } from '../domain/types'

/** Screen 08 — «Возврат»: the whole order or single lines, with the
 *  client's percent discount recalculated over what goes back. */
export function RefundModal() {
  const { no } = useParams()
  const navigate = useNavigate()
  const orderNo = Number(no)
  const back = () => navigate(`/orders/${orderNo}`)

  const order = useStore((s) => s.orders.find((o) => o.no === orderNo))
  const client = useStore((s) => (order ? clientOf(s, order.clientId) : undefined))
  const totals = useStore((s) => (order ? totalsOf(s, order) : undefined))
  const cash = useStore(cashSummary)
  const reasons = useStore((s) => s.paymentSettings.refundReasons)
  const user = useStore(currentUser)

  const [mode, setMode] = useState<'whole' | 'lines'>('lines')
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [reason, setReason] = useState(reasons[0] ?? '')
  // Возврат идёт тем же способом, каким платили: иначе картой оплаченный
  // заказ опустошает денежный ящик.
  const paidBy = order?.payments[order.payments.length - 1]?.method
  const [method, setMethod] = useState<PaymentMethod>(paidBy ?? 'Наличные')
  const [otherWayOk, setOtherWayOk] = useState(false)
  const closed = useStore(shiftClosed)

  /** Already-refunded quantities cap what can still go back. */
  const returnable = useMemo(() => {
    const used: Record<string, number> = {}
    for (const r of order?.refunds ?? []) {
      for (const l of r.lines) used[l.orderItemId] = (used[l.orderItemId] ?? 0) + l.qty
    }
    return (order?.items ?? []).map((i) => ({ item: i, left: i.qty - (used[i.id] ?? 0) }))
  }, [order])

  if (!order || !totals) {
    return (
      <Modal title="Заказ не найден" onClose={() => navigate('/orders')} aside={null}>
        <div className="empty">Такого заказа нет.</div>
      </Modal>
    )
  }

  const lines =
    mode === 'whole'
      ? returnable.filter((r) => r.left > 0).map((r) => ({ orderItemId: r.item.id, qty: r.left }))
      : Object.entries(picked)
          .filter(([, qty]) => qty > 0)
          .map(([orderItemId, qty]) => ({ orderItemId, qty }))

  const gross = lines.reduce((sum, l) => {
    const item = order.items.find((i) => i.id === l.orderItemId)
    return sum + (item ? item.price * l.qty : 0)
  }, 0)
  const pct = client?.discountPct ?? 0
  const discountBack = Math.round((gross * pct) / 100)
  const payout = Math.max(0, gross - discountBack)
  // Never hand back more than the client actually paid.
  const capped = Math.min(payout, totals.paid - totals.refunded)
  const otherWay = paidBy !== undefined && method !== paidBy
  const methodBlocked = otherWay && !otherWayOk

  return (
    <Modal
      title={`Возврат по заказу № ${order.no}`}
      onClose={back}
      hint="Операция появится в журнале кассы сразу после подтверждения"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={back}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={closed || capped <= 0 || methodBlocked}
            title={
              closed
                ? 'Смена закрыта — откройте новую'
                : methodBlocked
                ? `Заказ оплачен «${paidBy}» — подтвердите возврат другим способом`
                : capped <= 0
                  ? 'Выберите, что возвращать'
                  : 'Провести возврат'
            }
            onClick={() => {
              actions.refundOrder(order.id, { lines, amount: capped, reason, method })
              back()
            }}
          >
            Провести возврат
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Оплачено по заказу" value={money(totals.paid)} />
            <CardRow label="Выбрано к возврату" value={gross > 0 ? money(gross) : DASH} />
            <CardRow
              label={pct > 0 ? `Скидка ${pct} % пересчитана` : 'Скидка'}
              value={discountBack > 0 ? `−${money(discountBack)}` : DASH}
            />
            <CardTotal label="К выдаче" value={money(capped)} />
          </Card>

          <div className="card" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Наличных в кассе</span>
            <span style={{ fontSize: 13 }}>{money(cash.cashOnHand)}</span>
          </div>

          <div className="card-note">
            Возврат проводит администратор без согласования; операция попадёт в журнал кассы.
          </div>
        </>
      }
    >
      <SubTabs
        active={mode}
        onChange={(id) => setMode(id as 'whole' | 'lines')}
        style={{ margin: 0 }}
        tabs={[
          { id: 'whole', label: 'Весь заказ' },
          { id: 'lines', label: 'Отдельные позиции' },
        ]}
      />

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 40 }} />
            <th>Позиция</th>
            <th style={{ width: 80 }}>Кол-во</th>
            <th style={{ width: 100 }}>К возврату</th>
            <th style={{ width: 110 }}>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {returnable.map(({ item, left }) => {
            const qty = mode === 'whole' ? left : (picked[item.id] ?? 0)
            return (
              <tr key={item.id}>
                <td>
                  <Checkbox
                    checked={qty > 0}
                    onChange={() => {
                      if (mode === 'whole') return
                      setPicked((prev) => ({ ...prev, [item.id]: prev[item.id] ? 0 : left }))
                    }}
                  />
                </td>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>{qty}</td>
                <td style={qty > 0 ? { fontWeight: 700 } : undefined}>{money(item.price * item.qty)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <SelectField label="Причина возврата" value={reason} options={reasons} onChange={setReason} />

      <div className="form-grid">
        <SelectField
          label="Способ возврата"
          value={method}
          options={['Наличные', 'Карта', 'СБП по QR']}
          onChange={(v) => {
            setMethod(v as PaymentMethod)
            setOtherWayOk(false)
          }}
        />
        <SelectField
          label="Кто оформляет"
          value={user ? `${user.fullName}, ${user.role.toLowerCase()}` : ''}
          options={[]}
          onChange={() => undefined}
        />
      </div>

      {otherWay && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="field-error">
            Заказ оплачен «{paidBy}» — возврат «{method}» опустошает денежный ящик.
          </span>
          <Checkbox checked={otherWayOk} onChange={() => setOtherWayOk(!otherWayOk)}>
            Подтверждаю возврат другим способом, причина указана выше
          </Checkbox>
        </div>
      )}
    </Modal>
  )
}
