import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Card, CardKicker, CardRow, CardTotal, MoneyField, SelectField, TextArea } from '../components/ui'
import { clock, money } from '../lib/format'
import { actions, cashJournal, cashSummary, useStore } from '../state/store'

/** Screen 13 — «Внесение»: cash into the drawer.
 *  Not revenue: it only changes what is in the till. */
export function DepositModal() {
  const navigate = useNavigate()
  const close = () => navigate('/cash')

  const summary = useStore(cashSummary)
  const grounds = useStore((s) => s.paymentSettings.depositGrounds)
  const shift = useStore((s) => s.shift)
  const deposits = useStore((s) =>
    cashJournal(s).filter((op) => op.kind === 'Внесение'),
  )

  const [amount, setAmount] = useState(5000)
  const [ground, setGround] = useState(grounds[0] ?? '')
  const [from, setFrom] = useState(`${shift.admin}, администратор`)
  const [to, setTo] = useState(`${shift.cashier}, кассир`)
  const [comment, setComment] = useState('')

  return (
    <Modal
      title="Внесение денег в кассу"
      onClose={close}
      hint="Операция появится в журнале кассы сразу после подтверждения"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={amount <= 0}
            onClick={() => {
              actions.deposit({ amount, ground, from, to, comment })
              close()
            }}
          >
            Внести
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Сейчас в кассе" value={money(summary.cashOnHand)} />
            <CardRow label="Внесение" value={`+${money(amount)}`} />
            <CardTotal label="Станет в кассе" value={money(summary.cashOnHand + amount)} />
          </Card>

          <Card>
            <CardKicker>Внесения за смену</CardKicker>
            {deposits.map((op) => (
              <CardRow
                key={op.id}
                label={`${clock(op.at)} · ${op.subject.toLowerCase()}`}
                value={money(op.amount)}
              />
            ))}
            {deposits.length === 0 && <div className="card-note">Внесений ещё не было</div>}
          </Card>

          <div className="card-note">Внесение не считается выручкой смены.</div>
        </>
      }
    >
      <MoneyField label="Сумма внесения" value={amount} onChange={setAmount} />
      <SelectField label="Основание" value={ground} options={grounds} onChange={setGround} />
      <div className="form-grid">
        <SelectField label="Кто внёс" value={from} options={[from]} onChange={setFrom} />
        <SelectField label="Кто принял" value={to} options={[to]} onChange={setTo} />
      </div>
      <TextArea label="Комментарий" value={comment} onChange={setComment} />
    </Modal>
  )
}

/** Screen 14 — «Инкассация»: cash out of the drawer to the safe or bank. */
export function CollectionModal() {
  const navigate = useNavigate()
  const close = () => navigate('/cash')

  const summary = useStore(cashSummary)
  const grounds = useStore((s) => s.paymentSettings.collectionGrounds)
  const shift = useStore((s) => s.shift)
  const movements = useStore((s) =>
    cashJournal(s).filter((op) => op.kind === 'Выемка' || op.kind === 'Внесение'),
  )

  const [amount, setAmount] = useState(() => Math.max(0, summary.cashOnHand - shift.opening))
  const [ground, setGround] = useState(grounds[0] ?? '')
  const [from, setFrom] = useState(`${shift.cashier}, кассир`)
  const [to, setTo] = useState(`${shift.admin}, администратор`)
  const [comment, setComment] = useState('')

  const tooMuch = amount > summary.cashOnHand

  return (
    <Modal
      title="Инкассация"
      onClose={close}
      hint="Операция появится в журнале кассы сразу после подтверждения"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={amount <= 0 || tooMuch}
            onClick={() => {
              actions.collect({ amount, ground, from, to, comment })
              close()
            }}
          >
            Провести выемку
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Сейчас в кассе" value={money(summary.cashOnHand)} />
            <CardRow label="Выемка" value={`−${money(amount)}`} tone="neg" />
            <CardTotal
              label="Останется в кассе"
              value={money(summary.cashOnHand - amount)}
              tone={tooMuch ? 'neg' : undefined}
            />
          </Card>

          <Card>
            <CardKicker>Движение наличных за смену</CardKicker>
            {movements.slice(0, 4).map((op) => (
              <CardRow
                key={op.id}
                label={`${clock(op.at)} · ${op.kind === 'Выемка' ? op.cashier : op.subject.toLowerCase()}`}
                value={money(Math.abs(op.amount))}
              />
            ))}
          </Card>

          <div className="card-note">
            Размен {money(shift.opening)} сохраняется в кассе.
          </div>
        </>
      }
    >
      <MoneyField label="Сумма выемки" value={amount} onChange={setAmount} />
      <SelectField label="Основание" value={ground} options={grounds} onChange={setGround} />
      <div className="form-grid">
        <SelectField label="Кто передал" value={from} options={[from]} onChange={setFrom} />
        <SelectField label="Кто принял" value={to} options={[to]} onChange={setTo} />
      </div>
      <TextArea label="Комментарий" value={comment} onChange={setComment} />
    </Modal>
  )
}
