import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Printer, RotateCcw, Undo2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { toast } from '../lib/toast'
import {
  Card,
  CardKicker,
  CardRow,
  CardTotal,
  LiveMoney,
  CatalogRow,
  Checkbox,
  Field,
  Pill,
  SelectField,
  SubTabs,
  TextArea,
} from '../components/ui'
import { DASH, clock, duration, money } from '../lib/format'
import {
  effectiveStatus,
  elapsed,
  endTime,
  livePositions,
  now,
  orderTotals,
  refundedQty,
  statusLabel,
  statusTone,
} from '../domain/rules'
import {
  actions,
  clientOf,
  shiftClosed,
  tariffDurationOf,
  tariffTermsOf,
  totalsOf,
  useCan,
  useStore,
} from '../state/store'
import { ageOf } from './OrdersPage'

/** Screen 06 — «Карточка заказа»: where «Открыть» in the list leads.
 *  Check the order, take the money, close it. */
/** `readOnly` — вид по кнопке «Чек» из журнала кассы: те же параметры заказа,
 *  но ничего изменить нельзя. */
export function OrderCardModal({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { no } = useParams()
  const navigate = useNavigate()
  // Просмотр открывают из журнала кассы — туда и возвращаемся.
  const close = () => navigate(readOnly ? '/cash' : '/orders')

  const orderNo = Number(no)
  const order = useStore((s) => s.orders.find((o) => o.no === orderNo))
  const client = useStore((s) => (order ? clientOf(s, order.clientId) : undefined))
  const catalog = useStore((s) => s.catalog)
  const state = useStore((s) => s)
  // У открытого заказа доплата за время считается на текущий момент —
  // ровно как в окне оплаты, чтобы карточка и оплата не расходились.
  const totals = useStore((s) => {
    if (!order) return undefined
    if (order.status === 'closed') return totalsOf(s, order)
    return orderTotals(
      order,
      clientOf(s, order.clientId),
      tariffTermsOf(s, order.tariffItemId),
      order.endedAt ?? now(),
    )
  })

  const shiftIsClosed = useStore(shiftClosed)
  const mayEdit = useCan('orders.edit') && !shiftIsClosed
  const mayClose = useCan('orders.close') && !shiftIsClosed
  const mayPay = useCan('orders.pay') && !shiftIsClosed
  const mayRefund = useCan('orders.refund') && !shiftIsClosed
  const mayComment = useCan('orders.comment')
  const mayPrint = useCan('orders.print')
  const [tab, setTab] = useState<'services' | 'goods'>('services')
  const [comment, setComment] = useState(order?.comment ?? '')
  const freeReasons = useStore((s) => s.paymentSettings.freeReasons)
  const [freeReason, setFreeReason] = useState('')

  useEffect(() => {
    if (order) setComment(order.comment)
  }, [order?.id])

  if (!order || !totals) {
    return (
      <Modal title="Заказ не найден" onClose={close} aside={null}>
        <div className="empty">Такого заказа нет — вернитесь к списку.</div>
      </Modal>
    )
  }

  const dur = tariffDurationOf(state, order.tariffItemId)
  // Закрытый заказ не правят: сумма уже прошла по кассе. Чтобы поменять
  // состав, его сначала возвращают в работу.
  const locked = effectiveStatus(order, totals) === 'closed'
  // Заказ на нулевую сумму, по которому денег не прошло: закрываем только
  // с основанием, чтобы визит не пропал из учёта.
  const freeVisit = !locked && totals.payable === 0 && totals.paid === 0 && order.items.length > 0
  const freeReady = !freeVisit || freeReason !== ''
  const tone = statusTone(order, client, tariffTermsOf(state, order.tariffItemId))
  // В заказ идут только активные позиции: «На согласовании» ещё не продаётся.
  const services = catalog.filter((c) => c.status === 'active' && (c.category === 'Тариф' || c.category === 'Услуга'))
  const goods = catalog.filter((c) => c.status === 'active' && c.category === 'Товар')
  const visible = tab === 'services' ? services : goods

  const qtyOf = (catalogItemId: string) =>
    order.items.find((i) => i.catalogItemId === catalogItemId)?.qty ?? 0

  /** «· возвращено 1 из 1» рядом с ценой, если по позиции был возврат. */
  const returnedMeta = (catalogItemId: string) => {
    const line = order.items.find((i) => i.catalogItemId === catalogItemId)
    if (!line) return ''
    const back = refundedQty(order, line.id)
    return back > 0 ? ` · возвращено ${back} из ${line.qty}` : ''
  }

  const setQty = (catalogItemId: string, next: number) => {
    const c = catalog.find((x) => x.id === catalogItemId)!
    const existing = order.items.find((i) => i.catalogItemId === catalogItemId)
    let items = order.items
    if (next <= 0) {
      items = items.filter((i) => i.catalogItemId !== catalogItemId)
    } else if (existing) {
      items = items.map((i) => (i.catalogItemId === catalogItemId ? { ...i, qty: next } : i))
    } else {
      items = [
        ...items,
        {
          id: `oi-${order.no}-${catalogItemId}`,
          catalogItemId,
          name: c.name,
          unit: c.unit,
          price: c.price,
          qty: next,
        },
      ]
    }
    actions.updateOrder(order.id, { items })
  }

  const saveComment = (value: string) => {
    setComment(value)
    actions.updateOrder(order.id, { comment: value })
  }

  return (
    <Modal
      title={readOnly ? `Чек по заказу № ${order.no}` : `Заказ № ${order.no}`}
      onClose={close}
      hint={
        readOnly
          ? 'Просмотр заказа — изменить ничего нельзя'
          : locked
          ? 'Заказ закрыт: состав не меняется. Чтобы поправить — «Вернуть в работу»'
          : totals.remainder > 0
            ? `${order.postpay ? 'Постоплата' : 'Доплата'}: остаток ${money(totals.remainder)} — примите оплату, тогда заказ можно будет закрыть`
            : 'Остатка нет — заказ можно закрыть'
      }
      actions={
        readOnly ? (
          <>
            <button className="btn btn-secondary" type="button" onClick={close}>
              Закрыть
            </button>
            {mayPrint && (
              <button className="btn btn-primary" type="button" onClick={() => window.print()}>
                <Printer />
                Печать
              </button>
            )}
          </>
        ) : (
        <>
          {locked && (
            <button
              className="btn btn-secondary"
              type="button"
              disabled={!mayEdit}
              title={
                mayEdit
                  ? 'Снять закрытие, чтобы поправить состав'
                  : 'Нет права «Изменение состава»'
              }
              onClick={() => actions.reopenOrder(order.id)}
            >
              <RotateCcw />
              Вернуть в работу
            </button>
          )}
          <button
            className="btn btn-secondary"
            type="button"
            disabled={!mayClose || totals.remainder > 0 || locked || !freeReady}
            title={
              !mayClose
                ? 'Нет права «Закрытие заказа»'
                : locked
                ? 'Заказ уже закрыт'
                : totals.remainder > 0
                  ? `Сначала примите оплату: остаток ${money(totals.remainder)}`
                  : !freeReady
                    ? 'Укажите основание: по заказу не прошло ни рубля'
                    : 'Закрыть заказ'
            }
            onClick={() => {
              actions.closeOrder(order.id, freeVisit ? freeReason : undefined)
              toast(`Заказ № ${order.no} закрыт`)
              close()
            }}
          >
            Закрыть заказ
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!mayPay || totals.remainder <= 0}
            title={
              !mayPay
                ? 'Нет права «Приём оплаты»'
                : totals.remainder <= 0
                  ? 'По заказу нет остатка к оплате'
                  : 'Принять оплату'
            }
            onClick={() => navigate(`/orders/${order.no}/pay`)}
          >
            Принять оплату
          </button>
        </>
        )
      }
      aside={
        <>
          <Card>
            <CardRow label={`Позиции · ${livePositions(order)}`} value={money(totals.items)} />
            <CardRow
              label={client && client.discountPct > 0 ? `Скидка ${client.discountPct} %` : 'Скидка'}
              value={totals.discount > 0 ? `−${money(totals.discount)}` : DASH}
            />
            <CardRow
              label="Разовая скидка"
              value={totals.manualDiscount > 0 ? `−${money(totals.manualDiscount)}` : DASH}
            />
            <CardRow
              label="Доплата за время"
              value={totals.overtime > 0 ? `+${money(totals.overtime)}` : DASH}
              tone={totals.overtime > 0 ? 'accent' : undefined}
            />
            {totals.refunded > 0 && (
              <CardRow label="Возвращено" value={`−${money(totals.refunded)}`} tone="neg" />
            )}
            <CardRow label="Оплачено" value={totals.paid > 0 ? money(totals.paid) : DASH} />
            <CardTotal
              label="Остаток"
              value={<LiveMoney value={totals.remainder} />}
              tone={totals.remainder > 0 ? 'neg' : undefined}
            />
          </Card>

          <Card>
            <CardKicker>Время в зале</CardKicker>
            <CardRow label="Создан" value={<span className="mono">{clock(order.createdAt)}</span>} />
            <CardRow
              label="Окончание по тарифу"
              value={
                <span className="mono">
                  {endTime(order, dur) === undefined ? 'без ограничения' : clock(endTime(order, dur)!)}
                </span>
              }
            />
            <CardRow
              label="Прошло"
              value={<span className="mono">{duration(elapsed(order, dur))}</span>}
            />
          </Card>

          <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'calc(13px * var(--type-scale))', color: 'var(--fg-3)' }}>Статус</span>
            <Pill tone={tone}>{statusLabel(order, totals)}</Pill>
          </div>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Клиент">
          <input
            className="input"
            type="text"
            value={client?.fullName ?? 'Без клиента'}
            disabled
          />
        </Field>
        {client && client.children.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {client.children.map((ch) => (
              <Checkbox
                key={ch.id}
                checked={order.childIds.includes(ch.id)}
                onChange={() =>
                  readOnly ? undefined :
                  actions.updateOrder(order.id, {
                    childIds: order.childIds.includes(ch.id)
                      ? order.childIds.filter((x) => x !== ch.id)
                      : [...order.childIds, ch.id],
                  })
                }
              >
                {ch.name}, {ageOf(ch.birthDate)}
              </Checkbox>
            ))}
          </div>
        )}
      </div>

      {readOnly ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 'calc(12px * var(--type-scale))', color: 'var(--fg-3)' }}>Позиции заказа</span>
          <table className="tbl">
            <thead>
              <tr>
                <th>Наименование</th>
                <th style={{ width: 90 }}>Кол-во</th>
                <th style={{ width: 120 }}>Возвращено</th>
                <th style={{ width: 110 }}>Цена</th>
                <th style={{ width: 110 }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => {
                const back = refundedQty(order, i.id)
                return (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>
                      {i.qty} {i.unit}
                    </td>
                    <td className={back > 0 ? 'neg' : 'muted'}>
                      {back > 0 ? `возвращено ${back} из ${i.qty}` : DASH}
                    </td>
                    <td className="mono">{money(i.price)}</td>
                    <td style={{ fontWeight: 700 }}>{money(i.price * i.qty)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <SubTabs
            active={tab}
            onChange={(id) => setTab(id as 'services' | 'goods')}
            style={{ margin: 0 }}
            tabs={[
              { id: 'services', label: 'Услуги' },
              { id: 'goods', label: 'Товары' },
            ]}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visible.map((c) => (
              <CatalogRow
                key={c.id}
                name={c.name}
                meta={`${c.unit} · ${money(c.price)}${returnedMeta(c.id)}`}
                qty={qtyOf(c.id)}
                onChange={mayEdit && !locked ? (next) => setQty(c.id, next) : undefined}
              />
            ))}
          </div>
        </>
      )}

      {readOnly && order.payments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 'calc(12px * var(--type-scale))', color: 'var(--fg-3)' }}>Оплаты</span>
          {order.payments.map((pay) => (
            <div className="ref-row" key={pay.id}>
              <span>
                {clock(pay.at)} · {pay.title} · {pay.method} · {pay.cashier}
              </span>
              <b>{money(pay.amount)}</b>
            </div>
          ))}
        </div>
      )}

      {freeVisit && (
        <SelectField
          label="Основание бесплатного визита"
          value={freeReason}
          options={['', ...freeReasons]}
          onChange={setFreeReason}
        />
      )}

      <TextArea
        label="Комментарий к заказу"
        value={comment}
        onChange={readOnly || !mayComment ? undefined : saveComment}
      />

      {!readOnly && (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          disabled={!mayRefund || totals.paid - totals.refunded <= 0}
          title={
            !mayRefund
              ? 'Нет права «Возврат»'
              : totals.paid === 0
              ? 'Возвращать нечего: по заказу не было оплат'
              : totals.paid - totals.refunded <= 0
                ? 'Всё оплаченное уже возвращено'
                : 'Оформить возврат'
          }
          onClick={() => navigate(`/orders/${order.no}/refund`)}
        >
          <Undo2 />
          Оформить возврат
        </button>
        {totals.paid - totals.refunded <= 0 && (
          <span style={{ fontSize: 'calc(12px * var(--type-scale))', color: 'var(--fg-3)' }}>
            {totals.paid === 0 ? 'по заказу не было оплат' : 'всё оплаченное уже возвращено'}
          </span>
        )}
      </div>
      )}
    </Modal>
  )
}
