import { useState } from 'react'
import { Modal } from '../components/Modal'
import { Card, CardKicker, CardRow, CardTotal, MoneyField, SelectField, TextArea, TextField } from '../components/ui'
import { clock, money } from '../lib/format'
import { actions, openOrders, unpaidOrders, useStore } from '../state/store'

/** Screen 02 — «Открытие смены».
 *  Runs straight after the PIN: who is on, and how much cash the drawer
 *  starts the day with. */
export function ShiftOpenModal() {
  const shift = useStore((s) => s.shift)
  const users = useStore((s) => s.users)
  const previous = useStore((s) => s.shifts[0])
  const openCount = useStore((s) => openOrders(s).length)
  const unpaidCount = useStore((s) => unpaidOrders(s).length)

  const [admin, setAdmin] = useState(shift.admin)
  const [cashier, setCashier] = useState(shift.cashier)
  const [openedAt] = useState(clock(shift.openedAt))
  const [plannedClose, setPlannedClose] = useState('21:00')
  const [opening, setOpening] = useState(shift.opening)
  const [comment, setComment] = useState(shift.openComment)

  const admins = users.filter((u) => u.role !== 'Кассир').map((u) => shortForm(u.fullName))
  const cashiers = users.map((u) => shortForm(u.fullName))

  // What the previous shift left in the drawer; the cashier confirms it.
  const carried = previous?.closingCash ?? 0

  return (
    <Modal
      title="Открыть смену"
      onClose={() => actions.logout()}
      hint="Остаток на начало дня — это деньги, уже лежащие в кассе, отдельной операцией он не проводится"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={() => actions.logout()}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => actions.openShift({ opening, admin, cashier, comment })}
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
              <CardRow
                label="Пересчитано кассиром"
                value={money(opening)}
                tone={opening < carried ? 'neg' : undefined}
              />
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
        <SelectField label="Администратор" value={admin} options={admins} onChange={setAdmin} />
        <SelectField label="Кассир" value={cashier} options={cashiers} onChange={setCashier} />
      </div>
      <div className="form-grid">
        <TextField label="Открытие" value={openedAt} />
        <TextField label="Плановое закрытие" value={plannedClose} onChange={setPlannedClose} />
      </div>
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
