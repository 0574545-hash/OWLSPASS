import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banknote, CreditCard, QrCode } from 'lucide-react'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, MoneyField, Segmented, TextArea } from '../components/ui'
import { DASH, clock, money } from '../lib/format'
import { NOW, OVERTIME_RATE, orderTotals } from '../domain/rules'
import { actions, clientOf, tariffDuration, totalsOf, useStore } from '../state/store'
import type { PaymentMethod } from '../domain/types'

/** Screen 07 — «Оплата заказа»: where «Принять оплату» leads.
 *  The actual end of the visit is fixed here, so the over-time surcharge
 *  is calculated at this moment and not before. */
export function PaymentModal() {
  const { no } = useParams()
  const navigate = useNavigate()
  const orderNo = Number(no)
  const back = () => navigate(`/orders/${orderNo}`)

  const order = useStore((s) => s.orders.find((o) => o.no === orderNo))
  const client = useStore((s) => (order ? clientOf(s, order.clientId) : undefined))
  const stored = useStore((s) => (order ? totalsOf(s, order) : undefined))

  const [method, setMethod] = useState<PaymentMethod>('Наличные')
  const [comment, setComment] = useState('')

  // Settling now records the exit, which may add a time surcharge that the
  // card did not show while the order was still running.
  const dueTotals =
    order && stored
      ? orderTotals(order, client, tariffDuration(order.tariffItemId), order.endedAt ?? NOW)
      : undefined
  const due = dueTotals?.remainder ?? 0
  const [given, setGiven] = useState<number | null>(null)
  const tendered = given ?? due
  const change = Math.max(0, tendered - due)

  if (!order || !dueTotals) {
    return (
      <Modal title="Заказ не найден" onClose={() => navigate('/orders')} aside={null}>
        <div className="empty">Такого заказа нет.</div>
      </Modal>
    )
  }

  const earlier = order.payments[order.payments.length - 1]

  return (
    <Modal
      title={`Оплата заказа № ${order.no}`}
      onClose={back}
      hint="После оплаты заказ перейдёт в «Закрыт»"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={back}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={tendered < due || due <= 0}
            onClick={() => {
              actions.payOrder(order.id, { amount: due, method, comment })
              navigate('/orders')
            }}
          >
            Принять оплату
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label={`Позиции · ${order.items.length}`} value={money(dueTotals.items)} />
            <CardRow
              label={client && client.discountPct > 0 ? `Скидка ${client.discountPct} %` : 'Скидка'}
              value={dueTotals.discount > 0 ? `−${money(dueTotals.discount)}` : DASH}
            />
            <CardRow
              label="Разовая скидка"
              value={dueTotals.manualDiscount > 0 ? `−${money(dueTotals.manualDiscount)}` : DASH}
            />
            <CardRow
              label="Доплата за время"
              value={dueTotals.overtime > 0 ? `+${money(dueTotals.overtime)}` : DASH}
              tone={dueTotals.overtime > 0 ? 'accent' : undefined}
            />
            {dueTotals.paid > 0 && (
              <CardRow
                label={
                  earlier ? `Оплачено ${earlier.method.toLowerCase()} ${clock(earlier.at)}` : 'Оплачено ранее'
                }
                value={`−${money(dueTotals.paid)}`}
              />
            )}
            <CardTotal label="К оплате" value={money(due)} />
          </Card>

          <div className="card" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Сдача</span>
            <span style={{ font: '800 22px var(--font-display)', color: 'var(--owls-orange)' }}>
              {money(change)}
            </span>
          </div>

          <div className="card-note">
            Фактическое окончание фиксируется в момент оплаты: если время вышло за тариф, в расчёт
            добавится доплата по {OVERTIME_RATE} за час.
          </div>
        </>
      }
    >
      <Segmented
        equal
        value={method}
        onChange={setMethod}
        options={[
          { value: 'Наличные', label: 'Наличные', icon: <Banknote /> },
          { value: 'Карта', label: 'Карта', icon: <CreditCard /> },
          { value: 'СБП по QR', label: 'СБП по QR', icon: <QrCode /> },
        ]}
      />

      <MoneyField label="К оплате" value={due} />
      <MoneyField label="Внесено" value={tendered} onChange={setGiven} />
      <TextArea label="Комментарий" value={comment} onChange={setComment} />
    </Modal>
  )
}
