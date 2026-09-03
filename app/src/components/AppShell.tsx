import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Banknote,
  Bell,
  BookMarked,
  Clock,
  LayoutDashboard,
  Play,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react'
import { OwlsMark } from './OwlsMark'
import { Toasts } from './Toasts'
import { clock, initials, topbarName } from '../lib/format'
import { actions, currentUser, openOrders, shiftClosed, useCan, useStore } from '../state/store'

function SideItem({
  to,
  icon,
  label,
  badge,
}: {
  to: string
  icon: ReactNode
  label: string
  badge?: number
}) {
  return (
    <NavLink to={to} className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}>
      {icon}
      {label}
      {badge !== undefined && badge > 0 && <span className="sb-badge">{badge}</span>}
    </NavLink>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const orders = useStore((s) => openOrders(s).length)
  const shift = useStore((s) => s.shift)
  const user = useStore(currentUser)
  const unreadNotifications = useStore((s) => s.notifications.filter((n) => n.enabled).length)
  const mayOrders = useCan('orders.view')
  const mayClients = useCan('clients.view')
  const mayCash = useCan('cash.view')
  const mayCatalog = useCan('catalog.view')
  const maySettings = useCan('settings.view')
  const mayNotifications = useCan('settings.notifications')
  const closed = useStore(shiftClosed)
  const mayOpenShift = useCan('shift.open')

  const name = user?.fullName ?? 'Смирнова Елена Викторовна'
  const role = user?.role ?? 'Администратор'

  return (
    <div className="app viewport">
      <nav className="sb">
        <div className="sb-head" style={{ paddingBottom: 16, gap: 10 }}>
          <OwlsMark size={30} />
          <div style={{ lineHeight: 1.15 }}>
            <div className="brand-word">
              OWLS <span className="brand-pass">Pass</span>
            </div>
            <div className="brand-sub">Аква пати</div>
          </div>
        </div>

        {/* Раздел, на который у должности нет права, в меню не показываем. */}
        <SideItem to="/" icon={<LayoutDashboard />} label="Главное" />
        {mayOrders && <SideItem to="/orders" icon={<ReceiptText />} label="Заказы" badge={orders} />}
        {mayClients && <SideItem to="/clients" icon={<Users />} label="Клиенты" />}

        {mayCash && (
          <>
            <div className="sb-divider">О П Е Р А Ц И И</div>
            <SideItem to="/cash" icon={<Banknote />} label="Касса" />
          </>
        )}

        {(mayCatalog || maySettings) && <div className="sb-divider">С И С Т Е М А</div>}
        {mayCatalog && <SideItem to="/directories" icon={<BookMarked />} label="Справочники" />}
        {maySettings && <SideItem to="/settings" icon={<Settings />} label="Настройки" />}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: '100%' }}>
        <div className="topbar" style={{ gap: 12 }}>
          <div className="spacer" />
          <button
            className="pill-btn"
            type="button"
            disabled={!mayCash}
            onClick={() => mayCash && navigate('/cash')}
          >
            <Clock />
            {shift.closedAt === undefined
              ? `Смена открыта · ${clock(shift.openedAt)}`
              : `Смена № ${shift.no} закрыта · ${clock(shift.closedAt)}`}
          </button>
          {/* Смена закрыта — работать с кассой нельзя, пока не открыта новая. */}
          {closed && mayOpenShift && (
            <button className="btn btn-primary btn-sm" type="button" onClick={() => actions.startNewShift()}>
              <Play />
              Открыть новую смену
            </button>
          )}
          {mayNotifications && (
            <button
              className="icon-btn"
              type="button"
              aria-label="Уведомления"
              onClick={() => navigate('/settings/notifications')}
            >
              <Bell />
              {unreadNotifications > 0 && <span className="bubble">{unreadNotifications}</span>}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/logout')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              paddingLeft: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
            }}
            title="Выход из системы"
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: 'var(--owls-stone)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: '700 calc(12px * var(--type-scale)) var(--font-text)',
                color: 'var(--fg-2)',
              }}
            >
              {initials(name)}
            </div>
            <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 'calc(13px * var(--type-scale))' }}>{topbarName(name)}</div>
              <div style={{ fontSize: 'calc(11px * var(--type-scale))', color: 'var(--fg-3)' }}>{role}</div>
            </div>
          </button>
        </div>

        <div
          className="main-scroll"
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {children}
        </div>
      </div>
      <Toasts />
    </div>
  )
}

/** The page frame every list screen sits in. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div
      className="page page-anim"
      style={{
        padding: '24px 32px 32px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  )
}
