import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import {
  Card,
  CardKicker,
  CardRow,
  CardTotal,
  MoneyField,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import { clock, money, signedMoney } from '../lib/format'
import { now } from '../domain/rules'
import { actions, currentUser, openOrders, unpaidOrders, useCan, useStore } from '../state/store'

/** Screen 02 — «Открытие смены».
 *  Runs straight after the PIN: who is on, and how much cash the drawer
 *  starts the day with. */
export function ShiftOpenModal() {
  const navigate = useNavigate()
  const shift = useStore((s) => s.shift)
  // За кассой стоит тот, кто вошёл по PIN — его подпись пойдёт в операции.
  const me = useStore(currentUser)
  const users = useStore((s) => s.users)
  const previous = useStore((s) => s.shifts[0])
  const openCount = useStore((s) => openOrders(s).length)
  const unpaidCount = useStore((s) => unpaidOrders(s).length)
  const mayOpen = useCan('shift.open')

  // Администратор выбирается, кассир подставлен входом по PIN.
  const [admin, setAdmin] = useState('')
  const cashier = me ? shortForm(me.fullName) : shift.cashier
  // Смена открывается сейчас; закрытие запишется по факту закрытия.
  const [openedAt] = useState(now())
  // «Остаток на начало» подставляется тем, что оставила прошлая смена.
  const [opening, setOpening] = useState(shift.opening)
  const [comment, setComment] = useState(shift.openComment)

  // За кассу отвечает любой действующий сотрудник: рабочее время мы не
  // ведём. В списке нет только отключённых и неактивированных — им и
  // войти-то нельзя.
  const adminUsers = users.filter(
    (u) => u.role !== 'Кассир' && u.status !== 'disabled' && u.presence !== 'invited',
  )
  const admins = adminUsers.map((u) => shortForm(u.fullName))
  const adminUser = adminUsers.find((u) => shortForm(u.fullName) === admin)

  // What the previous shift left in the drawer; the cashier confirms it.
  const carried = previous?.closingCash ?? 0

  // Смену открывает тот, кому это право дано; остальные ждут старшего.
  if (!mayOpen) {
    return (
      <Modal
        title="Смена не открыта"
        dismissible={false}
        onClose={() => actions.logout()}
        aside={null}
        actions={
          <button className="btn btn-primary" type="button" onClick={() => actions.logout()}>
            Выйти
          </button>
        }
      >
        <div className="empty">
          У должности «{me?.role ?? '—'}» нет права «Открытие смены». Смену открывает старший смены,
          после этого войдите снова.
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Открыть смену"
      // Без открытой смены работать нельзя: окно не закрывается кликом
      // мимо, выйти можно только кнопкой.
      dismissible={false}
      onClose={() => actions.logout()}
      hint={
        admin === ''
          ? 'Выберите администратора смены — он отвечает за кассу'
          : 'Остаток на начало дня — это деньги, уже лежащие в кассе, отдельной операцией он не проводится'
      }
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={() => actions.logout()}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={admin === ''}
            title={admin === '' ? 'Выберите администратора смены' : 'Открыть смену'}
            onClick={() => {
              actions.openShift({
                opening,
                admin: adminUser ? shortForm(adminUser.fullName) : admin,
                cashier,
                comment,
                openedAt,
              })
              // Смена открыта — администратор идёт к заказам.
              navigate('/orders')
            }}
          >
            Открыть смену
          </button>
        </>
      }
      aside={
        <>
          <Card>
            {/* «Остаток на начало дня» — то, что вчерашняя смена оставила
                в ящике. Кассир пересчитывает и подтверждает эту сумму. */}
            <CardRow label="Осталось с прошлой смены" value={money(carried)} />
            {opening !== carried && (
              <>
                <CardRow label="Пересчитано кассиром" value={money(opening)} />
                <CardRow
                  label="Расхождение на начало"
                  value={signedMoney(opening - carried)}
                  tone="neg"
                />
              </>
            )}
            <CardTotal label="В кассе на старте" value={money(opening)} />
          </Card>

          {previous && (
            <Card>
              <CardKicker>Прошлая смена</CardKicker>
              <CardRow
                label={`Смена № ${previous.no} закрыта`}
                value={previous.closedAt !== undefined ? clock(previous.closedAt) : '—'}
              />
              <CardRow label="В кассе на конец смены" value={money(previous.closingCash)} />
              <CardRow
                label="Расхождение"
                value={previous.discrepancy === 0 ? '0' : money(previous.discrepancy)}
                tone={previous.discrepancy < 0 ? 'neg' : undefined}
              />
            </Card>
          )}

          <div className="card-note">
            Деньги остаются в кассе между сменами. Если пересчёт не сошёлся с
            суммой на конец прошлой смены — впишите фактическую, разница попадёт
            в историю.
          </div>

          <Card>
            <CardKicker>Незакрытые дела</CardKicker>
            <CardRow
              label="Заказы с долгом"
              value={<b className="neg">{unpaidCount}</b>}
            />
            <CardRow label="Открытые заказы" value={<b>{openCount}</b>} />
          </Card>
        </>
      }
    >
      <div className="form-grid">
        <SelectField
          label="Администратор"
          value={admin}
          options={['', ...admins]}
          onChange={setAdmin}
        />
        <TextField label="Кассир (по PIN)" value={cashier} />
      </div>
      <TextField label="Открытие смены" value={clock(openedAt)} />
      <MoneyField label="Остаток на начало дня" value={opening} onChange={setOpening} />
      <TextArea label="Комментарий" value={comment} onChange={setComment} />
    </Modal>
  )
}

function shortForm(fullName: string): string {
  const [last, first, middle] = fullName.split(' ')
  if (!first) return last ?? ''
  return `${last} ${first.charAt(0)}. ${middle ? `${middle.charAt(0)}.` : ''}`.trim()
}
