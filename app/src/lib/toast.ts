/**
 * Короткое подтверждение внизу справа: «действие прошло». Живёт вне
 * состояния кассы — уведомление ничего не считает и не сохраняется.
 */
export interface ToastItem {
  id: number
  text: string
}

const LIFETIME_MS = 3200

let items: ToastItem[] = []
let seq = 0
const subscribers = new Set<() => void>()

function emit(): void {
  subscribers.forEach((notify) => notify())
}

export function toast(text: string): void {
  const id = ++seq
  items = [...items, { id, text }]
  emit()
  window.setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, LIFETIME_MS)
}

export function subscribeToasts(notify: () => void): () => void {
  subscribers.add(notify)
  return () => {
    subscribers.delete(notify)
  }
}

/** Ссылка меняется только вместе с содержимым — useSyncExternalStore
 *  сравнивает снимки по ссылке. */
export function toastSnapshot(): ToastItem[] {
  return items
}
