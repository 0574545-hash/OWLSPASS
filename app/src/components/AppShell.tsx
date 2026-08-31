import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Banknote,
  Bell,
  BookMarked,
  Clock,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react'
import { clock, initials, topbarName } from '../lib/format'
import { currentUser, openOrders, useCan, useStore } from '../state/store'

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

  const name = user?.fullName ?? 'Смирнова Елена Викторовна'
  const role = user?.role ?? 'Администратор'

  return (
    <div className="app viewport">
      <nav className="sb">
        <div className="sb-head" style={{ paddingBottom: 16, gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--owls-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              font: '800 15px var(--font-display)',
            }}
          >
            А
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ font: '800 15px var(--font-display)', letterSpacing: '-.01em' }}>
              Аква пати
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--fg-4)',
                letterSpacing: '.12em',
                textTransform: 'uppercase',
              }}
            >
              CRM
            </div>
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
              : `Смена закрыта · ${clock(shift.closedAt)}`}
          </button>
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
                font: '700 12px var(--font-text)',
                color: 'var(--fg-2)',
              }}
            >
              {initials(name)}
            </div>
            <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{topbarName(name)}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{role}</div>
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
    </div>
  )
}

/** The page frame every list screen sits in. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div
      className="page"
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
