import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, Checkbox, Segmented, SelectField, TextField } from '../components/ui'
import { actions, useStore } from '../state/store'
import type { AccessRights, User } from '../domain/types'

const ACCESS_LABELS: { key: keyof AccessRights; label: string }[] = [
  { key: 'ordersPayment', label: 'Заказы: оплата' },
  { key: 'cashPayment', label: 'Касса: приём оплаты' },
  { key: 'clientsEdit', label: 'Клиенты: правка карточек и скидок' },
  { key: 'catalogEdit', label: 'Справочники: изменение позиций' },
  { key: 'settings', label: 'Настройки центра' },
]

/** Screen 25 — «Пользователь и права»: where «Добавить» and «Права» lead.
 *  Disabling is a status here, not a separate action — it saves with the
 *  rest of the card. */
export function UserModal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const back = () => navigate('/settings')

  const existing = useStore((s) => s.users.find((u) => u.id === id))
  const roles = useStore((s) => s.roles.map((r) => r.name))
  const [draft, setDraft] = useState<User>(() => existing ?? actions.newUserDraft())

  if (id && id !== 'new' && !existing) {
    return (
      <Modal title="Сотрудник не найден" onClose={back} aside={null}>
        <div className="empty">Такой карточки нет.</div>
      </Modal>
    )
  }

  const patch = (p: Partial<User>) => setDraft((d) => ({ ...d, ...p }))
  const enabled = ACCESS_LABELS.filter((a) => draft.access[a.key]).length

  return (
    <Modal
      title={draft.fullName || 'Новый сотрудник'}
      onClose={back}
      hint="Права применяются при следующем входе сотрудника"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={back}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={draft.fullName.trim() === '' || draft.pin.length !== 4}
            onClick={() => {
              actions.saveUser({
                ...draft,
                accessSummary: ACCESS_LABELS.filter((a) => draft.access[a.key])
                  .map((a) => a.label.split(':')[0]!)
                  .join(', '),
              })
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
            <CardRow label="Должность" value={draft.role} />
            <CardRow label="Смен за месяц" value={draft.shiftsThisMonth} />
            <CardRow
              label="Расхождений"
              value={draft.discrepancies}
              tone={draft.discrepancies > 0 ? 'neg' : undefined}
            />
            <CardTotal label="Прав включено" value={`${enabled} из ${ACCESS_LABELS.length}`} />
          </Card>
          <div className="card-note">
            Отключённый сотрудник не войдёт по PIN, история его операций сохраняется.
          </div>
        </>
      }
    >
      <TextField label="ФИО" value={draft.fullName} onChange={(v) => patch({ fullName: v })} />

      <div className="form-grid">
        <SelectField label="Должность" value={draft.role} options={roles} onChange={(v) => patch({ role: v })} />
        <TextField label="Телефон" value={draft.phone} onChange={(v) => patch({ phone: v })} />
      </div>

      <div className="form-grid">
        <TextField label="Смена" value={draft.schedule} onChange={(v) => patch({ schedule: v })} />
        <TextField
          label="PIN для входа"
          value={draft.pin}
          onChange={(v) => patch({ pin: v.replace(/\D/g, '').slice(0, 4) })}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Статус</span>
        <Segmented
          value={draft.status}
          onChange={(v) => patch({ status: v })}
          options={[
            { value: 'working', label: 'Работает' },
            { value: 'disabled', label: 'Отключён' },
          ]}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Доступ</span>
        {ACCESS_LABELS.map((a) => (
          <Checkbox
            key={a.key}
            checked={draft.access[a.key]}
            onChange={() => patch({ access: { ...draft.access, [a.key]: !draft.access[a.key] } })}
          >
            {a.label}
          </Checkbox>
        ))}
      </div>
    </Modal>
  )
}
