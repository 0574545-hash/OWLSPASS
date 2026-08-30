import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, MoneyField, Segmented, SelectField, TextField } from '../components/ui'
import { OVERTIME_RATE } from '../domain/rules'
import { money } from '../lib/format'
import { actions, useStore } from '../state/store'
import type { CatalogCategory, CatalogItem } from '../domain/types'

const UNITS = ['чел.', 'шт.', 'пара', 'час', 'набор', '%']
const CATEGORIES: CatalogCategory[] = ['Тариф', 'Услуга', 'Товар', 'Скидка']

/** Screen 23 — «Позиция справочника»: one form for a tariff, a service,
 *  a product and a discount. */
export function CatalogItemModal() {
  const { id, category } = useParams()
  const navigate = useNavigate()
  const back = () => navigate(-1)

  const existing = useStore((s) => s.catalog.find((c) => c.id === id))
  const [draft, setDraft] = useState<CatalogItem>(
    () => existing ?? actions.newCatalogDraft((category as CatalogCategory) ?? 'Тариф'),
  )

  if (id && !existing) {
    return (
      <Modal title="Позиция не найдена" onClose={back} aside={null}>
        <div className="empty">Такой позиции нет.</div>
      </Modal>
    )
  }

  const patch = (p: Partial<CatalogItem>) => setDraft((d) => ({ ...d, ...p }))

  return (
    <Modal
      title={draft.name || 'Новая позиция'}
      onClose={back}
      footerLeft={
        existing ? (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => navigate(`/directories/item/${existing.id}/delete`)}
          >
            <Trash2 />
            Удалить
          </button>
        ) : (
          <span className="modal-hint">Позиция появится в каталоге сразу после сохранения</span>
        )
      }
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={back}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={draft.name.trim() === ''}
            onClick={() => {
              actions.saveCatalogItem(draft)
              back()
            }}
          >
            Сохранить
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Категория" value={draft.category} />
            <CardRow label="Использован в заказах" value={draft.usedInOrders ?? 0} />
            <CardRow label="Изменён" value={draft.changedAt ?? '—'} />
            <CardTotal
              label={`Цена за ${draft.unit}`}
              value={draft.category === 'Скидка' ? `${draft.price} %` : money(draft.price)}
            />
          </Card>
          <div className="card-note">
            Длительность задаёт время окончания в заказе; превышение считается по тарифу «Доплата за
            час сверх тарифа» — {OVERTIME_RATE} за час.
          </div>
        </>
      }
    >
      <TextField label="Наименование" value={draft.name} onChange={(v) => patch({ name: v })} />

      <div className="form-grid">
        <SelectField
          label="Категория"
          value={draft.category}
          options={CATEGORIES}
          onChange={(v) => patch({ category: v as CatalogCategory })}
        />
        <SelectField label="Единица" value={draft.unit} options={UNITS} onChange={(v) => patch({ unit: v })} />
      </div>

      <div className="form-grid">
        <MoneyField label="Цена" value={draft.price} onChange={(v) => patch({ price: v })} />
        <TextField
          label="Длительность"
          value={draft.durationMin ? `${draft.durationMin / 60} ч` : ''}
          onChange={(v) => {
            const hours = Number(v.replace(/[^\d.,]/g, '').replace(',', '.'))
            patch({ durationMin: Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : undefined })
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Статус</span>
        <Segmented
          value={draft.status}
          onChange={(v) => patch({ status: v })}
          options={[
            { value: 'active', label: 'Активен' },
            { value: 'hidden', label: 'Скрыт' },
          ]}
        />
      </div>
    </Modal>
  )
}
