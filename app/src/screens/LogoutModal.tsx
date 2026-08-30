import { useNavigate } from 'react-router-dom'
import { Lock, LogOut } from 'lucide-react'
import { Modal } from '../components/Modal'
import { Card, CardRow, CardTotal } from '../components/ui'
import { clock } from '../lib/format'
import { actions, currentUser, openOrders, unpaidOrders, useStore } from '../state/store'

/** Screen 18 — «Выход из системы»: stepping away from the desk, or
 *  leaving for good with the till counted. */
export function LogoutModal() {
  const navigate = useNavigate()
  const close = () => navigate(-1)

  const user = useStore(currentUser)
  const shift = useStore((s) => s.shift)
  const open = useStore((s) => openOrders(s).length)
  const unpaid = useStore((s) => unpaidOrders(s).length)

  return (
    <Modal
      title="Выход из системы"
      onClose={close}
      hint="Блокировка не закрывает смену: операции продолжатся после входа по PIN"
      actions={
        <button className="btn btn-secondary" type="button" onClick={close}>
          Отмена
        </button>
      }
      aside={
        <>
          <Card>
            <CardRow
              label={user?.fullName ?? shift.admin}
              value={(user?.role ?? 'Администратор').toLowerCase()}
            />
            <CardRow label="Вход в смену" value={<span className="mono">{clock(shift.openedAt)}</span>} />
            <CardRow label="Открытых заказов" value={<b>{open}</b>} />
            <CardTotal label="Не оплачено" value={unpaid} tone="neg" />
          </Card>
          <div className="card-note">
            Открытые заказы останутся за сменой, долги — за клиентами.
          </div>
        </>
      }
    >
      <button type="button" className="choice on" onClick={() => actions.lock()}>
        <Lock style={{ width: 18, height: 18, color: 'var(--owls-orange)' }} />
        <span style={{ flex: 1 }}>
          <span className="choice-title">Заблокировать рабочее место</span>
          <span className="choice-sub">Смена продолжается, вход по PIN</span>
        </span>
      </button>

      <button type="button" className="choice" onClick={() => navigate('/cash/close')}>
        <LogOut style={{ width: 18, height: 18, color: 'var(--fg-2)' }} />
        <span style={{ flex: 1 }}>
          <span className="choice-title">Выйти и закрыть смену</span>
          <span className="choice-sub">
            Откроется пересчёт кассы. Смена другого сотрудника открывается заново после его входа
          </span>
        </span>
      </button>
    </Modal>
  )
}
