import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** Сколько живёт затухание закрытого окна — столько же стоит в CSS. */
const CLOSE_MS = 420

/**
 * The «формат А» window every dialog in this product uses:
 * 1040 × 720, header 64 / two columns (form + 360 summary) / footer 68.
 * Fixed by the user across the whole canvas, so it lives in one place.
 */
export function Modal({
  title,
  onClose,
  dismissible = true,
  hint,
  actions,
  footerLeft,
  aside,
  children,
}: {
  title: string
  onClose: () => void
  /** Окно, из которого нельзя просто выйти: клик по фону и Escape не
   *  закрывают его — так работает открытие смены. */
  dismissible?: boolean
  /** Small grey line on the left of the footer. */
  hint?: ReactNode
  /** Buttons on the right of the footer. */
  actions?: ReactNode
  /** Replaces the hint with arbitrary content (e.g. the «Удалить» ghost button). */
  footerLeft?: ReactNode
  aside: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, dismissible])

  // Окно закрывается вместе со сменой адреса, то есть исчезает из разметки
  // мгновенно. Чтобы оно успело затухнуть, на его место остаётся копия: она
  // гаснет на месте и убирает себя сама. Копия ничего не перехватывает —
  // работать со списком под ней можно сразу.
  const shell = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = shell.current
    return () => {
      if (!node) return
      // Одно окно сменило другое (заказ → оплата) — гасить нечего.
      if (document.querySelector('.modal-backdrop')) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const ghost = node.cloneNode(true) as HTMLElement
      ghost.className = 'modal-ghost-backdrop'
      ghost.setAttribute('aria-hidden', 'true')
      const win = ghost.querySelector('.modal')
      if (win) win.className = 'modal-ghost-win'
      // Прокрутку переносим, иначе копия «перематывается» к началу формы.
      const from = node.querySelectorAll<HTMLElement>('.modal-main, .modal-aside')
      const to = ghost.querySelectorAll<HTMLElement>('.modal-main, .modal-aside')
      from.forEach((el, i) => {
        const target = to[i]
        if (target) target.scrollTop = el.scrollTop
      })
      document.body.appendChild(ghost)
      window.setTimeout(() => ghost.remove(), CLOSE_MS)
    }
  }, [])

  return (
    <div
      ref={shell}
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          {dismissible && (
            <button className="icon-btn" type="button" aria-label="Закрыть" onClick={onClose}>
              <X />
            </button>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-main">{children}</div>
          <div className="modal-aside">{aside}</div>
        </div>

        <div className="modal-foot">
          {footerLeft ?? <span className="modal-hint">{hint}</span>}
          <div className="modal-actions">{actions}</div>
        </div>
      </div>
    </div>
  )
}
