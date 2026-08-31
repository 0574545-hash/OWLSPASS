import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal, Checkbox, TextField } from '../components/ui'
import { actions, useStore } from '../state/store'
import {
  ALL_PERMISSION_IDS,
  PERMISSION_SECTIONS,
  permissionsOfSection,
} from '../domain/permissions'
import type { Role } from '../domain/types'

/** «Добавить должность» и «Изменить» на вкладке «Должности» — то же окно
 *  формата А, что и карточка сотрудника. Права набираются из справочника
 *  «Права доступа»: галочка = разрешено. */
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
  const has = (id: string) => draft.permissions.includes(id)
  const toggle = (id: string) =>
    patch({
      permissions: has(id) ? draft.permissions.filter((x) => x !== id) : [...draft.permissions, id],
    })
  const toggleSection = (ids: string[], on: boolean) =>
    patch({
      permissions: on
        ? [...new Set([...draft.permissions, ...ids])]
        : draft.permissions.filter((x) => !ids.includes(x)),
    })

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
            {PERMISSION_SECTIONS.map((section) => {
              const ids = permissionsOfSection(section).map((p) => p.id)
              return (
                <CardRow
                  key={section}
                  label={section}
                  value={`${ids.filter(has).length} из ${ids.length}`}
                />
              )
            })}
            <CardTotal
              label="Прав открыто"
              value={`${draft.permissions.length} из ${ALL_PERMISSION_IDS.length}`}
            />
          </Card>
          <div className="card-note">
            Перечень прав — справочник «Права доступа». Должность назначается сотруднику в его
            карточке; переименование переносит всех, кто на ней числится.
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

      {PERMISSION_SECTIONS.map((section) => {
        const items = permissionsOfSection(section)
        const ids = items.map((p) => p.id)
        const allOn = ids.every(has)
        return (
          <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="card-kicker">{section}</span>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => toggleSection(ids, !allOn)}
              >
                {allOn ? 'Снять все' : 'Отметить все'}
              </button>
            </div>
            {items.map((p) => (
              <Checkbox key={p.id} checked={has(p.id)} onChange={() => toggle(p.id)}>
                {p.label}
                {p.risky ? ' ⚠' : ''}
              </Checkbox>
            ))}
          </div>
        )
      })}
    </Modal>
  )
}
