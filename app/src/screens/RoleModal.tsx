import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, SelectField, TextField } from '../components/ui'
import { actions, useStore } from '../state/store'
import type { Role } from '../domain/types'

/** Права должности — те же пять направлений, что показывает таблица
 *  «Должности». Список значений один на всё приложение. */
const RIGHTS: { key: keyof Role; label: string; options: string[] }[] = [
  { key: 'orders', label: 'Заказы', options: ['Полный доступ', 'Создание, оплата', 'Оплата', 'Просмотр', 'Нет'] },
  { key: 'clients', label: 'Клиенты', options: ['Полный доступ', 'Создание, правка', 'Просмотр', 'Нет'] },
  { key: 'cash', label: 'Касса', options: ['Полный доступ', 'Приём оплаты', 'Просмотр', 'Нет'] },
  { key: 'discounts', label: 'Скидки', options: ['Любые', 'До 15 %', 'До 10 %', 'Нет'] },
  { key: 'catalog', label: 'Справочники', options: ['Изменение', 'Просмотр', 'Нет'] },
]

/** «Добавить должность» и «Изменить» на вкладке «Должности» —
 *  то же окно формата А, что и карточка сотрудника. */
export function RoleModal() {
  const { name } = useParams()
  const navigate = useNavigate()
  const back = () => navigate('/settings/roles')

  const isNew = name === undefined || name === 'new'
  const decoded = isNew ? '' : decodeURIComponent(name)
  const existing = useStore((s) => s.roles.find((r) => r.name === decoded))
  const holders = useStore((s) => s.users.filter((u) => u.role === decoded).length)
  const roleNames = useStore((s) => s.roles.map((r) => r.name))

  const [draft, setDraft] = useState<Role>(() => existing ?? actions.newRoleDraft())

  if (!isNew && !existing) {
    return (
      <Modal title="Должность не найдена" onClose={back} aside={null}>
        <div className="empty">Такой должности нет.</div>
      </Modal>
    )
  }

  const patch = (p: Partial<Role>) => setDraft((d) => ({ ...d, ...p }))
  const granted = RIGHTS.filter((r) => draft[r.key] !== 'Нет').length
  const taken = roleNames.some((n) => n !== decoded && n === draft.name.trim())
  const canSave = draft.name.trim() !== '' && !taken

  return (
    <Modal
      title={draft.name || 'Новая должность'}
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
            disabled={!canSave}
            title={
              draft.name.trim() === ''
                ? 'Впишите название должности'
                : taken
                  ? 'Должность с таким названием уже есть'
                  : 'Сохранить'
            }
            onClick={() => {
              actions.saveRole({ ...draft, name: draft.name.trim() }, isNew ? undefined : decoded)
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
            <CardRow label="Людей на должности" value={isNew ? 0 : holders} />
            {RIGHTS.map((r) => (
              <CardRow key={r.key} label={r.label} value={String(draft[r.key])} />
            ))}
            <CardTotal label="Направлений открыто" value={`${granted} из ${RIGHTS.length}`} />
          </Card>
          <div className="card-note">
            Должность назначается сотруднику в его карточке. Переименование переносит всех, кто на
            ней числится.
          </div>
        </>
      }
    >
      <TextField
        label="Название должности"
        value={draft.name}
        onChange={(v) => patch({ name: v })}
        error={taken ? 'Такая должность уже есть' : ''}
      />

      <div className="form-grid">
        {RIGHTS.map((r) => (
          <SelectField
            key={r.key}
            label={r.label}
            value={String(draft[r.key])}
            options={r.options}
            onChange={(v) => patch({ [r.key]: v } as Partial<Role>)}
          />
        ))}
      </div>
    </Modal>
  )
}
