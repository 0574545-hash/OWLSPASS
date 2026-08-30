import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, MoneyField, SelectField, TextArea, TextField } from '../components/ui'
import { actions, useStore } from '../state/store'

const REASONS = [
  'Тариф выведен из прайса',
  'Позиция больше не продаётся',
  'Заведена по ошибке',
  'Заменена другой позицией',
]

/** Screen 30 — «Подтверждение удаления»: one window for every deletion. */
export function ConfirmDeleteModal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const back = () => navigate(-1)

  const item = useStore((s) => s.catalog.find((c) => c.id === id))
  const openUsage = useStore((s) =>
    s.orders.filter(
      (o) => o.status === 'open' && o.items.some((i) => i.catalogItemId === id),
    ).length,
  )

  const [reason, setReason] = useState(REASONS[0]!)
  const [comment, setComment] = useState('')

  if (!item) {
    return (
      <Modal title="Позиция не найдена" onClose={back} aside={null}>
        <div className="empty">Удалять нечего — позиция уже отсутствует.</div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Удалить позицию"
      onClose={back}
      hint="Удаление можно отменить только через восстановление позиции в справочнике"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={back}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              actions.deleteCatalogItem(item.id)
              navigate('/directories')
            }}
          >
            Удалить
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Использована в заказах" value={item.usedInOrders ?? 0} />
            <CardRow
              label="В открытых заказах"
              value={<b className={openUsage > 0 ? 'neg' : ''}>{openUsage}</b>}
            />
            <CardTotal label="Станет доступна" value="Нет" small />
          </Card>
          <div className="card-note">
            История заказов сохранится, но выбрать эту позицию в новых заказах будет нельзя.
          </div>
        </>
      }
    >
      <TextField label="Позиция" value={item.name} />
      <div className="form-grid">
        <TextField label="Категория" value={item.category} />
        <MoneyField label="Цена" value={item.price} />
      </div>
      <SelectField label="Причина удаления" value={reason} options={REASONS} onChange={setReason} />
      <TextArea label="Комментарий" value={comment} onChange={setComment} />
    </Modal>
  )
}
