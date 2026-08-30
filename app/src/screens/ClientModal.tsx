import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Modal } from '../components/Modal'
import {
  Card,
  CardRow,
  CardTotal,
  Field,
  FieldWithPlus,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import { DASH, money } from '../lib/format'
import { actions, clientBalance, useStore } from '../state/store'
import type { Child, Client } from '../domain/types'

/** Screens 10 and 11 — «Добавить клиента» and «Карточка клиента».
 *  One window: creating it is the same form with nothing filled in. */
export function ClientModal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === undefined
  const close = () => navigate('/clients')

  const existing = useStore((s) => s.clients.find((c) => c.id === id))
  const grounds = useStore((s) => s.discountGrounds)
  const balance = useStore((s) => (id ? clientBalance(s, id) : 0))

  const [draft, setDraft] = useState<Client>(() => existing ?? actions.newClientDraft())
  const [children, setChildren] = useState<Child[]>(() =>
    (existing?.children ?? []).length > 0
      ? existing!.children
      : [{ id: `ch-${Date.now()}`, name: '', birthDate: '' }],
  )

  if (!isNew && !existing) {
    return (
      <Modal title="Клиент не найден" onClose={close} aside={null}>
        <div className="empty">Такой карточки нет.</div>
      </Modal>
    )
  }

  const patch = (p: Partial<Client>) => setDraft((d) => ({ ...d, ...p }))

  const applyGround = (name: string) => {
    const ground = grounds.find((g) => g.name === name)
    patch({
      discountGround: name,
      // «Ручная» leaves the percent to the administrator.
      discountPct: ground?.percent ?? draft.discountPct,
    })
  }

  const addChild = () => {
    if (children.length >= 10) return
    setChildren((prev) => [...prev, { id: `ch-${Date.now()}-${prev.length}`, name: '', birthDate: '' }])
  }

  const save = () => {
    const kept = children.filter((c) => c.name.trim() !== '')
    actions.saveClient({ ...draft, children: kept })
    close()
  }

  const canSave = draft.fullName.trim() !== '' && draft.phone.trim() !== ''

  return (
    <Modal
      title={isNew ? 'Добавить клиента' : draft.fullName}
      onClose={close}
      hint={isNew ? 'Обязательные поля: ФИО и телефон' : 'Изменения применяются к новым заказам клиента'}
      actions={
        isNew ? (
          <>
            <button className="btn btn-secondary" type="button" onClick={close}>
              Отмена
            </button>
            <button className="btn btn-primary" type="button" disabled={!canSave} onClick={save}>
              Создать
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/orders/new')}>
              Создать заказ
            </button>
            <button className="btn btn-primary" type="button" disabled={!canSave} onClick={save}>
              Сохранить
            </button>
          </>
        )
      }
      aside={
        isNew ? (
          <>
            <Card>
              <CardRow label="Скидка по карточке" value={draft.discountPct > 0 ? `${draft.discountPct} %` : DASH} />
              <CardRow label="Детей в карточке" value={children.filter((c) => c.name.trim()).length} />
              <CardTotal label="Действует до" value={draft.discountUntil || DASH} small />
            </Card>
            <div className="card-note">
              Дата рождения ребёнка нужна для расчёта детского тарифа и подарка в день рождения.
            </div>
          </>
        ) : (
          <>
            <Card>
              <CardRow label="Клиент с" value={draft.since} />
              <CardRow label="Визитов" value={draft.visits} />
              <CardRow label="Последний визит" value={draft.lastVisit} />
              <CardTotal label="Сумма заказов" value={money(draft.ordersTotal)} />
            </Card>
            <div className="card" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Задолженность</span>
              <span style={{ fontSize: 13 }} className={balance < 0 ? 'neg' : ''}>
                {balance < 0 ? money(-balance) : DASH}
              </span>
            </div>
            <div className="card-note">
              Дата рождения ребёнка нужна для расчёта детского тарифа и подарка в день рождения.
            </div>
          </>
        )
      }
    >
      <TextField label="ФИО родителя" value={draft.fullName} onChange={(v) => patch({ fullName: v })} />

      <div className="form-grid">
        <TextField label="Телефон" value={draft.phone} onChange={(v) => patch({ phone: v })} />
        <TextField label="Дата рождения" value={draft.birthDate} onChange={(v) => patch({ birthDate: v })} />
      </div>

      <div className="form-grid">
        <TextField
          label="Скидка"
          value={draft.discountPct > 0 ? `${draft.discountPct} %` : ''}
          onChange={(v) => patch({ discountPct: Number(v.replace(/\D/g, '')) || 0 })}
        />
        <SelectField
          label="Основание"
          value={draft.discountGround}
          options={grounds.map((g) => g.name)}
          onChange={applyGround}
        />
      </div>

      <TextArea label="Комментарий" value={draft.comment} onChange={(v) => patch({ comment: v })} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Файл</span>
        <div className="file-row">
          <FileText style={{ width: 16, height: 16, color: 'var(--owls-orange)' }} />
          <span className="file-name">{draft.file?.name ?? 'Документ не загружен'}</span>
          <span className="file-size">{draft.file?.size ?? ''}</span>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() =>
              patch({ file: { name: 'подтверждение_скидки.pdf', size: '286 КБ' } })
            }
          >
            {draft.file ? 'Заменить' : 'Загрузить'}
          </button>
        </div>
      </div>

      {children.map((child, i) => {
        const last = i === children.length - 1
        const setChild = (p: Partial<Child>) =>
          setChildren((prev) => prev.map((c, j) => (j === i ? { ...c, ...p } : c)))
        return (
          <div className="form-grid" key={child.id}>
            {last ? (
              <FieldWithPlus
                label="Ребёнок · имя"
                value={child.name}
                onChange={(v) => setChild({ name: v })}
                onPlus={addChild}
                plusLabel="Добавить ребёнка"
              />
            ) : (
              <TextField label="Ребёнок · имя" value={child.name} onChange={(v) => setChild({ name: v })} />
            )}
            <Field label="Дата рождения">
              <input
                className="input"
                type="text"
                value={child.birthDate}
                onChange={(e) => setChild({ birthDate: e.target.value })}
              />
            </Field>
          </div>
        )
      })}
    </Modal>
  )
}
