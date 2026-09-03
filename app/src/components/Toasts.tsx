import { useSyncExternalStore } from 'react'
import { subscribeToasts, toastSnapshot } from '../lib/toast'

/** Подтверждения действий: выезжают внизу справа и уходят сами. */
export function Toasts() {
  const items = useSyncExternalStore(subscribeToasts, toastSnapshot, toastSnapshot)
  if (items.length === 0) return null
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  )
}
