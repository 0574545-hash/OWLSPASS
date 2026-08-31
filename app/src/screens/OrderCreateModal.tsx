import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import {
  Card,
  CardKicker,
  CardRow,
  CardTotal,
  CatalogRow,
  Checkbox,
  ClientPicker,
  MoneyField,
  TextArea,
  TextField,
  SubTabs,
} from '../components/ui'
import { DASH, money } from '../lib/format'
import { NOW, SHIFT_DATE } from '../domain/rules'
import { actions, clientBalance, nextOrderNo, tariffDuration, useStore } from '../state/store'
import type { CatalogItem, OrderItem } from '../domain/types'
import { ageOf } from './OrdersPage'

/** Screen 05 — «Создать заказ». */
export function OrderCreateModal() {
  const navigate = useNavigate()
  const close = () => navigate('/orders')

  const clients = useStore((s) => s.clients)
  const catalog = useStore((s) => s.catalog)
  const nextNo = useStore(nextOrderNo)

  // Поле клиента пустое, если только заказ не создают из поиска по клиенту —
  // тогда он уже выбран.
  const [params] = useSearchParams()
  const [clientId, setClientId] = useState(params.get('client') ?? '')
  const [checkedChildren, setCheckedChildren] = useState<string[]>([])
  const [tab, setTab] = useState<'services' | 'goods'>('services')
  const [qty, setQty] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [manualDiscount, setManualDiscount] = useState(0)

  const client = clients.find((c) => c.id === clientId)
  const balance = useStore((s) => (clientId ? clientBalance(s, clientId) : 0))

  const services = catalog.filter((c) => c.status !== 'hidden' && (c.category === 'Тариф' || c.category === 'Услуга'))
  const goods = catalog.filter((c) => c.status !== 'hidden' && c.category === 'Товар')
  const visible = tab === 'services' ? services : goods

  const items = useMemo(() => toItems(catalog, qty, nextNo), [catalog, qty, nextNo])
  const gross = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discountPct = client?.discountPct ?? 0
  const discount = Math.round((gross * discountPct) / 100)
  const payable = Math.max(0, gross - discount - manualDiscount)

  // The tariff line drives окончание; the longest-running chosen line wins.
  const tariffItem = pickTariff(catalog, qty)

  const create = () => {
    if (!clientId || items.length === 0) return
    actions.createOrder({
      clientId,
      childIds: checkedChildren,
      items,
      comment,
      manualDiscount,
      tariffItemId: tariffItem?.id ?? '',
      tariffLabel: labelFor(tariffItem),
    })
    // Окно закрывается: карточка заказа нужна, когда его открывают из списка.
    navigate('/orders')
  }

  return (
    <Modal
      title="Новый заказ"
      onClose={close}
      hint={
        !clientId
          ? 'Выберите клиента — начните вводить ФИО, имя ребёнка или телефон'
          : items.length === 0
            ? 'Добавьте хотя бы одну позицию'
            : 'Заказ появится в списке со статусом «Открыт»'
      }
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={create}
            disabled={!clientId || items.length === 0}
            title={
              !clientId ? 'Сначала выберите клиента' : items.length === 0 ? 'Добавьте позиции' : 'Создать заказ'
            }
          >
            Создать заказ
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label={`Позиции · ${items.length}`} value={money(gross)} />
            <CardRow
              label={discountPct > 0 ? `Скидка ${discountPct} %` : 'Скидка'}
              value={discount > 0 ? `−${money(discount)}` : DASH}
            />
            <CardRow
              label="Разовая скидка"
              value={manualDiscount > 0 ? `−${money(manualDiscount)}` : DASH}
            />
            <CardTotal label="К оплате" value={money(payable)} />
          </Card>

          <Card>
            <CardKicker>Клиент</CardKicker>
            <CardRow label="Постоянная скидка" value={discountPct > 0 ? `${discountPct} %` : DASH} />
            <CardRow label="Визитов за год" value={client?.visits ?? 0} />
            <CardRow
              label="Долг"
              value={balance < 0 ? money(-balance) : DASH}
              tone={balance < 0 ? 'neg' : 'muted'}
            />
          </Card>
        </>
      }
    >
      <div className="form-grid">
        <TextField label="Номер заказа" value={String(nextNo)} />
        <TextField label="Дата" value={SHIFT_DATE} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ClientPicker
          clients={clients}
          value={clientId}
          onSelect={(id) => {
            setClientId(id)
            setCheckedChildren([])
          }}
          onAdd={() => navigate('/clients/new')}
        />
        {client && client.children.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {client.children.map((ch) => (
              <Checkbox
                key={ch.id}
                checked={checkedChildren.includes(ch.id)}
                onChange={() =>
                  setCheckedChildren((prev) =>
                    prev.includes(ch.id) ? prev.filter((x) => x !== ch.id) : [...prev, ch.id],
                  )
                }
              >
                {ch.name}, {ageOf(ch.birthDate)}
              </Checkbox>
            ))}
          </div>
        )}
      </div>

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
            meta={`${c.unit} · ${money(c.price)}`}
            qty={qty[c.id] ?? 0}
            onChange={(next) => setQty((prev) => ({ ...prev, [c.id]: next }))}
          />
        ))}
      </div>

      <TextArea label="Комментарий к заказу" value={comment} onChange={setComment} />
      <MoneyField label="Разовая скидка" value={manualDiscount} onChange={setManualDiscount} />
    </Modal>
  )
}

/* ---------- shared helpers, also used by the order card ---------- */

export function toItems(
  catalog: CatalogItem[],
  qty: Record<string, number>,
  no: number,
): OrderItem[] {
  return Object.entries(qty)
    .filter(([, n]) => n > 0)
    .map(([id, n], i) => {
      const c = catalog.find((x) => x.id === id)!
      return { id: `oi-${no}-${i}-${id}`, catalogItemId: id, name: c.name, unit: c.unit, price: c.price, qty: n }
    })
}

/** Единица «мин» без длительности — безлимитный тариф. */
function isUnlimitedItem(c: CatalogItem): boolean {
  return c.unit === 'мин' && !c.durationMin
}

/** The chosen line with the longest duration sets the end of the visit.
 *  Безлимитный тариф длиннее любого другого — он и выигрывает. */
export function pickTariff(catalog: CatalogItem[], qty: Record<string, number>): CatalogItem | undefined {
  const chosen = Object.entries(qty)
    .filter(([id, n]) => n > 0 && id !== 'tariff-overtime')
    .map(([id]) => catalog.find((c) => c.id === id))
    .filter((c): c is CatalogItem => !!c && (!!c.durationMin || isUnlimitedItem(c)))
  if (chosen.length === 0) return catalog.find((c) => c.id === 'tariff-2h')
  const unlimited = chosen.find(isUnlimitedItem)
  if (unlimited) return unlimited
  return chosen.reduce((a, b) => ((a.durationMin ?? 0) >= (b.durationMin ?? 0) ? a : b))
}

export function labelFor(item: CatalogItem | undefined): string {
  if (!item) return 'Без тарифа'
  if (item.category === 'Услуга') return 'Праздничная программа'
  if (isUnlimitedItem(item)) return 'Безлимит'
  const hours = (item.durationMin ?? 120) / 60
  return `Разовый, ${hours} ч`
}

export { NOW, tariffDuration }
