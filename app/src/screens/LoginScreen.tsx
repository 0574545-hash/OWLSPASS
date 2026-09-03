import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'
import { actions, useStore } from '../state/store'

/** Screen 01 — «Вход в систему».
 *  PIN only: the system works out who the employee is, what they may do
 *  and whose signature goes on the shift's operations. */
export function LoginScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const locked = useStore((s) => s.session.locked)

  const press = (digit: string) => {
    if (pin.length >= 4) return
    setError('')
    setPin(pin + digit)
  }

  const submit = () => {
    const result = actions.login(pin)
    if (!result.ok) {
      setError(result.error ?? 'Неверный PIN')
      setPin('')
      return
    }
    // Signing back in after a lock returns straight to the running shift.
    if (locked) actions.resumeShift()
  }

  // Four digits are enough to identify the employee — submit on the fourth.
  useEffect(() => {
    if (pin.length === 4) {
      const id = setTimeout(submit, 120)
      return () => clearTimeout(id)
    }
    return undefined
  }, [pin])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="login-screen">
      <div className="login-card">
        <div>
          <div style={{ font: '800 calc(26px * var(--type-scale)) var(--font-display)', letterSpacing: '-.02em', textAlign: 'center' }}>
            Введите PIN
          </div>
        </div>

        <div className="pin-cells">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-cell${i === pin.length ? ' next' : ''}`}>
              {i < pin.length ? '•' : ''}
            </div>
          ))}
        </div>

        <div className="pin-error">{error}</div>

        <div className="pin-pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} className="btn btn-secondary" type="button" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button className="btn btn-ghost" type="button" style={{ height: 52 }} onClick={() => setError('PIN выдаёт управляющий в разделе «Настройки → Пользователи»')}>
            Забыли PIN
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => press('0')}>
            0
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            style={{ height: 52 }}
            aria-label="Стереть"
            onClick={() => setPin(pin.slice(0, -1))}
          >
            <Delete />
          </button>
        </div>

        <button
          className="btn btn-primary btn-block"
          type="button"
          style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={submit}
        >
          Войти
        </button>
      </div>
    </div>
  )
}
