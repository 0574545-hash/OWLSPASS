import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EyeOff, Trash2 } from 'lucide-react'
import { Modal } from '../components/Modal'
import { toast } from '../lib/toast'
import {
  Card,
  CardRow,
  CardTotal,
  HoldButton,
  MoneyField,
  Segmented,
  SelectField,
  TextField,
} from '../components/ui'
import { money } from '../lib/format'
import { CATALOG_UNITS } from '../domain/seed'
import { actions, useCan, useStore } from '../state/store'
import type { CatalogCategory, CatalogItem } from '../domain/types'

const UNITS = CATALOG_UNITS
/** Длительность имеет смысл только у позиций, измеряемых в минутах. */
const DURATION_UNIT = 'мин'
const CATEGORIES: CatalogCategory[] = ['Тариф', 'Услуга', 'Товар', 'Скидка']

/** Screen 23 — «Позиция справочника»: one form for a tariff, a service,
 *  a product and a discount. */
export function CatalogItemModal() {
  const { id, category } = useParams()
  const navigate = useNavigate()
  const back = () => navigate(-1)

  const existing = useStore((s) => s.catalog.find((c) => c.id === id))
  // Позицию, по которой прошли заказы, физически не удаляют: иначе из
  // старых чеков пропадёт наименование.
  const mayEdit = useCan('catalog.edit')
  const mayDelete = useCan('catalog.delete')
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

  const used = draft.usedInOrders ?? 0
  const byMinutes = draft.unit === DURATION_UNIT
  // Экстра-время есть только там, где есть от чего его отсчитывать.
  const hasDuration = byMinutes && !!draft.durationMin

  return (
    <Modal
      title={draft.name || (existing ? 'Редактирование позиции' : 'Новая позиция')}
      onClose={back}
      footerLeft={
        existing && mayDelete ? (
          used > 0 ? (
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              title={`Позиция уже в ${used} заказах — её нельзя удалить, только скрыть`}
              disabled={draft.status === 'hidden'}
              onClick={() => {
                actions.saveCatalogItem({ ...draft, status: 'hidden' })
                back()
              }}
            >
              <EyeOff />
              {draft.status === 'hidden' ? 'Уже скрыта' : 'Скрыть'}
            </button>
          ) : (
            // Удаление позиции — тоже удержанием: случайно нажать нельзя.
            <HoldButton
              title="Удерживайте 2 секунды, чтобы удалить"
              onHold={() => navigate(`/directories/item/${existing.id}/delete`)}
            >
              <Trash2 />
              Удалить
            </HoldButton>
          )
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
            disabled={!mayEdit || draft.name.trim() === ''}
            title={mayEdit ? 'Сохранить' : 'Нет права «Правка позиций»'}
            onClick={() => {
              actions.saveCatalogItem(draft)
              toast(existing ? `«${draft.name}» сохранена` : `«${draft.name}» добавлена в справочник`)
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
            <CardRow
              label="Экстра время"
              value={draft.extraPerMin ? `${money(draft.extraPerMin)} за мин` : 'не начисляется'}
            />
            <CardTotal
              label={
                byMinutes && draft.durationMin
                  ? `Цена за ${draft.durationMin} мин`
                  : `Цена за ${draft.unit}`
              }
              value={draft.category === 'Скидка' ? `${draft.price} %` : money(draft.price)}
            />
          </Card>
          <div className="card-note">
            Длительность задаёт время окончания в заказе. Минуты сверх неё считаются по цене
            экстра-времени; не указана или 0 — доплаты нет. Единица «мин» без длительности —
            безлимитный тариф: время окончания не ставится.
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
        <SelectField
          label="Единица"
          value={draft.unit}
          options={UNITS}
          onChange={(v) => patch({ unit: v })}
        />
      </div>

      <div className="form-grid-3">
        <MoneyField label="Цена" value={draft.price} onChange={(v) => patch({ price: v })} />
        <TextField
          label="Длительность, мин"
          placeholder={byMinutes ? 'пусто — безлимит' : 'только для единицы «мин»'}
          value={draft.durationMin ? String(draft.durationMin) : ''}
          onChange={
            byMinutes
              ? (v) => {
                  const min = Number(v.replace(/\D/g, ''))
                  patch({ durationMin: Number.isFinite(min) && min > 0 ? min : undefined })
                }
              : undefined
          }
        />
        <TextField
          label="Экстра время, цена за мин"
          placeholder={hasDuration ? 'пусто — доплаты нет' : 'нужны «мин» и длительность'}
          value={draft.extraPerMin === undefined ? '' : String(draft.extraPerMin)}
          onChange={
            hasDuration
              ? (v) => {
                  const digits = v.replace(/\D/g, '')
                  patch({ extraPerMin: digits === '' ? undefined : Number(digits) })
                }
              : undefined
          }
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
