import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Modal } from '../components/Modal'
import { toast } from '../lib/toast'
import {
  Card,
  CardRow,
  CardTotal,
  DateField,
  FieldWithPlus,
  PhoneField,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import {
  CHILD_MIN_YEAR,
  DASH,
  MAX_DISCOUNT_PCT,
  birthDateError,
  childBirthError,
  clampPercent,
  digitsOnly,
  isChildNameValid,
  isPhoneComplete,
  money,
  phoneError,
} from '../lib/format'
import { actions, clientBalance, useCan, useStore } from '../state/store'
import type { Child, Client } from '../domain/types'

/** Screens 10 and 11 — «Добавить клиента» and «Карточка клиента».
 *  One window: creating it is the same form with nothing filled in. */
export function ClientModal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === undefined
  // Карточку открывают и из «Клиентов», и кнопкой «+» со страницы заказов —
  // возвращаемся туда, откуда пришли, а не всегда в список клиентов.
  const close = () => navigate(-1)

  const existing = useStore((s) => s.clients.find((c) => c.id === id))
  const grounds = useStore((s) => s.discountGrounds)
  const balance = useStore((s) => (id ? clientBalance(s, id) : 0))
  const allClients = useStore((s) => s.clients)

  const mayEdit = useCan('clients.edit')
  const mayCreate = useCan('clients.create')
  const mayDiscount = useCan('clients.discount')
  const mayFile = useCan('clients.file')

  const [draft, setDraft] = useState<Client>(() => existing ?? actions.newClientDraft())
  const fileInput = useRef<HTMLInputElement>(null)
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

  // Строку ребёнка либо не трогали вовсе, либо она должна быть заполнена целиком.
  const childNameError = (c: Child) => {
    if (c.name.trim() === '') return c.birthDate.trim() === '' ? '' : 'Укажите имя ребёнка'
    return isChildNameValid(c.name) ? '' : 'Только буквы кириллицы'
  }
  const childBirthErrorOf = (c: Child) => {
    if (c.birthDate.trim() === '') return c.name.trim() === '' ? '' : 'Укажите дату рождения'
    return childBirthError(c.birthDate)
  }
  const childFilled = (c: Child) => c.name.trim() !== '' && c.birthDate.trim() !== ''
  const childValid = (c: Child) => childFilled(c) && childNameError(c) === '' && childBirthErrorOf(c) === ''
  const childBlank = (c: Child) => c.name.trim() === '' && c.birthDate.trim() === ''

  const lastChild = children[children.length - 1]
  // Следующего ребёнка не добавляем, пока текущий не заполнен правильно.
  const canAddChild = children.length < 10 && lastChild !== undefined && childValid(lastChild)

  const addChild = () => {
    if (!canAddChild) return
    setChildren((prev) => [...prev, { id: `ch-${Date.now()}-${prev.length}`, name: '', birthDate: '' }])
  }

  const save = () => {
    const kept = children.filter(childValid)
    actions.saveClient({ ...draft, children: kept })
    toast(existing ? 'Карточка клиента сохранена' : `Клиент ${draft.fullName} добавлен`)
    close()
  }

  const phoneErr = phoneError(draft.phone)
  const birthErr = birthDateError(draft.birthDate)
  // Один телефон — один клиент: иначе в поиске две одинаковые карточки.
  const duplicate =
    isPhoneComplete(draft.phone) &&
    allClients.some((c) => c.id !== draft.id && digitsOnly(c.phone) === digitsOnly(draft.phone))
  const phoneMessage = duplicate ? 'Клиент с таким телефоном уже есть' : phoneErr

  // Скидка без основания не сохраняется: иначе непонятно, за что она дана.
  const discountError =
    draft.discountPct > 0 && draft.discountGround.trim() === ''
      ? 'Выберите основание скидки'
      : draft.discountPct > MAX_DISCOUNT_PCT
        ? `Не больше ${MAX_DISCOUNT_PCT} %`
        : ''

  const childrenOk = children.every((c) => childBlank(c) || childValid(c))
  const mayWrite = isNew ? mayCreate : mayEdit
  const canSave =
    mayWrite &&
    draft.fullName.trim() !== '' &&
    isPhoneComplete(draft.phone) &&
    !duplicate &&
    birthErr === '' &&
    childrenOk &&
    discountError === ''

  return (
    <Modal
      title={isNew ? 'Добавить клиента' : draft.fullName}
      onClose={close}
      hint={
        isNew
          ? 'Обязательные поля: ФИО и телефон из 10 цифр'
          : 'Изменения применяются к новым заказам клиента'
      }
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
              <CardRow label="Детей в карточке" value={children.filter(childValid).length} />
              <CardTotal label="Действует до" value={draft.discountUntil || DASH} small />
            </Card>
            <div className="card-note">
              Дата рождения ребёнка нужна для расчёта детского тарифа и подарка в день рождения.
              Не раньше {CHILD_MIN_YEAR} года.
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
              Не раньше {CHILD_MIN_YEAR} года.
            </div>
          </>
        )
      }
    >
      <TextField label="ФИО родителя" value={draft.fullName} onChange={(v) => patch({ fullName: v })} />

      <div className="form-grid">
        <PhoneField
          label="Телефон"
          value={draft.phone}
          onChange={(v) => patch({ phone: v })}
          error={phoneMessage}
        />
        <DateField
          label="Дата рождения родителя"
          value={draft.birthDate}
          onChange={(v) => patch({ birthDate: v })}
          error={birthErr}
        />
      </div>

      <div className="form-grid">
        <SelectField
          label="Основание скидки"
          value={draft.discountGround}
          options={['', ...grounds.map((g) => g.name)]}
          onChange={mayDiscount ? applyGround : () => undefined}
        />
        <TextField
          label="Скидка"
          placeholder="0–100 %"
          value={draft.discountPct > 0 ? `${draft.discountPct} %` : ''}
          onChange={mayDiscount ? (v) => patch({ discountPct: clampPercent(v) }) : undefined}
          error={discountError}
        />
      </div>

      <TextArea label="Комментарий" value={draft.comment} onChange={(v) => patch({ comment: v })} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Файл</span>
        <div className="file-row">
          <FileText style={{ width: 16, height: 16, color: 'var(--owls-orange)' }} />
          <span className="file-name">{draft.file?.name ?? 'Документ не загружен'}</span>
          <span className="file-size">{draft.file?.size ?? ''}</span>
          <input
            ref={fileInput}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png,.heic"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) patch({ file: { name: f.name, size: fileSize(f.size) } })
              e.target.value = ''
            }}
          />
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            disabled={!mayFile}
            title={mayFile ? '' : 'Нет права «Загрузка файла»'}
            onClick={() => fileInput.current?.click()}
          >
            {draft.file ? 'Заменить' : 'Загрузить'}
          </button>
          {draft.file && (
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              title="Убрать файл"
              onClick={() => patch({ file: undefined })}
            >
              Убрать
            </button>
          )}
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
                plusLabel={
                  canAddChild
                    ? 'Добавить ребёнка'
                    : 'Сначала заполните имя и дату рождения этого ребёнка'
                }
                plusDisabled={!canAddChild}
                error={childNameError(child)}
              />
            ) : (
              <TextField
                label="Ребёнок · имя"
                value={child.name}
                onChange={(v) => setChild({ name: v })}
                error={childNameError(child)}
              />
            )}
            <DateField
              label="Дата рождения"
              value={child.birthDate}
              onChange={(v) => setChild({ birthDate: v })}
              error={childBirthErrorOf(child)}
            />
          </div>
        )
      })}
    </Modal>
  )
}

/** «286 КБ» — размер выбранного файла человеческим языком. */
function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}
