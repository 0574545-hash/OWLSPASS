import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, PhoneField, Segmented, SelectField, TextField } from '../components/ui'
import { actions, useStore } from '../state/store'
import {
  ALL_PERMISSION_IDS,
  PERMISSION_SECTIONS,
  permissionsOfSection,
} from '../domain/permissions'
import type { User } from '../domain/types'

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
  // Права сотрудник получает от должности — здесь их только показываем.
  const granted = useStore((s) => s.roles.find((r) => r.name === draft.role)?.permissions ?? [])

  if (id && id !== 'new' && !existing) {
    return (
      <Modal title="Сотрудник не найден" onClose={back} aside={null}>
        <div className="empty">Такой карточки нет.</div>
      </Modal>
    )
  }

  const patch = (p: Partial<User>) => setDraft((d) => ({ ...d, ...p }))

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
                accessSummary: `${granted.length} из ${ALL_PERMISSION_IDS.length}`,
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
            <CardTotal
              label="Прав по должности"
              value={`${granted.length} из ${ALL_PERMISSION_IDS.length}`}
            />
          </Card>
          <div className="card-note">
            Права даёт должность — их набирают в «Настройки → Должности». Отключённый сотрудник не
            войдёт по PIN, история его операций сохраняется.
          </div>
        </>
      }
    >
      <TextField label="ФИО" value={draft.fullName} onChange={(v) => patch({ fullName: v })} />

      <div className="form-grid">
        <SelectField label="Должность" value={draft.role} options={roles} onChange={(v) => patch({ role: v })} />
        <PhoneField label="Телефон" value={draft.phone} onChange={(v) => patch({ phone: v })} />
      </div>

      <div className="form-grid">
        <TextField label="Смена" value={draft.schedule} onChange={(v) => patch({ schedule: v })} />
        <TextField
          label="PIN для входа"
          value={draft.pin}
          onChange={(v) => patch({ pin: v.replace(/\D/g, '').slice(0, 4) })}
        />
      </div>

      {draft.presence === 'invited' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="field-error">
            Приглашение не активировано — PIN сотрудника пока не работает.
          </span>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => patch({ presence: 'off' })}
          >
            Активировать сотрудника
          </button>
        </div>
      )}

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
          Доступ по должности «{draft.role}»
        </span>
        {PERMISSION_SECTIONS.map((section) => {
          const items = permissionsOfSection(section).filter((p) => granted.includes(p.id))
          if (items.length === 0) return null
          return (
            <div className="ref-row" key={section}>
              <span>
                <b>{section}:</b> {items.map((p) => p.label).join(', ')}
              </span>
            </div>
          )
        })}
        {granted.length === 0 && (
          <div className="card-note">У этой должности пока нет ни одного права.</div>
        )}
      </div>
    </Modal>
  )
}
