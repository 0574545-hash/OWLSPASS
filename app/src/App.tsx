import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LoginScreen } from './screens/LoginScreen'
import { ShiftOpenModal } from './screens/ShiftOpenModal'
import { HomePage } from './screens/HomePage'
import { OrdersPage } from './screens/OrdersPage'
import { OrderCreateModal } from './screens/OrderCreateModal'
import { OrderCardModal } from './screens/OrderCardModal'
import { PaymentModal } from './screens/PaymentModal'
import { RefundModal } from './screens/RefundModal'
import { ClientsPage } from './screens/ClientsPage'
import { ClientModal } from './screens/ClientModal'
import { CashPage } from './screens/CashPage'
import { CollectionModal, DepositModal } from './screens/CashOpModals'
import { ShiftCloseModal, ShiftReportModal } from './screens/ShiftCloseModals'
import { LogoutModal } from './screens/LogoutModal'
import { DirectoriesPage } from './screens/DirectoriesPage'
import { CatalogItemModal } from './screens/CatalogItemModal'
import { SettingsPage } from './screens/SettingsPage'
import { RoleModal } from './screens/RoleModal'
import { UserModal } from './screens/UserModal'
import { ConfirmDeleteModal } from './screens/ConfirmDeleteModal'
import { can, getState, useCan, useStore } from './state/store'

/** Экран, на который у должности нет права, не открывается: вместо него —
 *  первый доступный раздел. Ссылки на него из меню и так убраны, но адрес
 *  можно набрать руками или прийти по старой закладке. */
function Guard({ need, children }: { need: string; children: ReactNode }) {
  const allowed = useCan(need)
  if (allowed) return <>{children}</>
  return <Navigate to={firstAllowedPath()} replace />
}

/** Куда отправить того, кому текущий адрес закрыт. */
function firstAllowedPath(): string {
  const s = getState()
  const order: [string, string][] = [
    ['orders.view', '/orders'],
    ['cash.view', '/cash'],
    ['clients.view', '/clients'],
    ['catalog.view', '/directories'],
    ['settings.view', '/settings'],
  ]
  const found = order.find(([permission]) => can(s, permission))
  // Главная открыта всем — она и есть последний рубеж.
  return found ? found[1] : '/'
}

/**
 * Modals render over the page they were opened from, exactly as the canvas
 * draws them: the list stays visible behind the overlay. Each modal path is
 * registered twice — once in the page layer, where it resolves to the list
 * the window belongs on, and once in the overlay layer.
 */
export function App() {
  const signedIn = useStore((s) => s.session.userId !== null && !s.session.locked)
  const shiftStarted = useStore((s) => s.shiftStarted)

  if (!signedIn) return <LoginScreen />
  if (!shiftStarted) return <ShiftOpenModal />

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/orders" element={<Guard need="orders.view"><OrdersPage /></Guard>} />
          <Route path="/orders/new" element={<Guard need="orders.view"><OrdersPage /></Guard>} />
          <Route path="/orders/:no" element={<Guard need="orders.view"><OrdersPage /></Guard>} />
          <Route path="/orders/:no/view" element={<Guard need="orders.view"><OrdersPage /></Guard>} />
          <Route path="/orders/:no/pay" element={<Guard need="orders.view"><OrdersPage /></Guard>} />
          <Route path="/orders/:no/refund" element={<Guard need="orders.view"><OrdersPage /></Guard>} />

          <Route path="/clients" element={<Guard need="clients.view"><ClientsPage /></Guard>} />
          <Route path="/clients/new" element={<Guard need="clients.view"><ClientsPage /></Guard>} />
          <Route path="/clients/:id" element={<Guard need="clients.view"><ClientsPage /></Guard>} />

          <Route path="/cash" element={<Guard need="cash.view"><CashPage /></Guard>} />
          <Route path="/cash/:tab" element={<Guard need="cash.view"><CashPage /></Guard>} />
          <Route path="/cash/deposit" element={<Guard need="cash.view"><CashPage /></Guard>} />
          <Route path="/cash/collect" element={<Guard need="cash.view"><CashPage /></Guard>} />
          <Route path="/cash/close" element={<Guard need="cash.view"><CashPage /></Guard>} />
          <Route path="/cash/report" element={<Guard need="cash.view"><CashPage /></Guard>} />

          <Route path="/directories" element={<Guard need="catalog.view"><DirectoriesPage /></Guard>} />
          <Route path="/directories/item/:id" element={<Guard need="catalog.view"><DirectoriesPage /></Guard>} />
          <Route path="/directories/item/:id/delete" element={<Guard need="catalog.view"><DirectoriesPage /></Guard>} />
          <Route path="/directories/:tab" element={<Guard need="catalog.view"><DirectoriesPage /></Guard>} />
          <Route path="/directories/:tab/new/:category" element={<Guard need="catalog.view"><DirectoriesPage /></Guard>} />

          <Route path="/settings" element={<Guard need="settings.view"><SettingsPage /></Guard>} />
          <Route path="/settings/users/:id" element={<Guard need="settings.view"><SettingsPage /></Guard>} />
          <Route path="/settings/roles/:name" element={<Guard need="settings.view"><SettingsPage tab="roles" /></Guard>} />
          <Route path="/settings/:tab" element={<Guard need="settings.view"><SettingsPage /></Guard>} />

          <Route path="/logout" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      {/* The overlay layer — every «формат А» window. */}
      <Routes>
        <Route path="/orders/new" element={<Guard need="orders.create"><OrderCreateModal /></Guard>} />
        <Route path="/orders/:no" element={<Guard need="orders.view"><OrderCardModal /></Guard>} />
        <Route path="/orders/:no/view" element={<Guard need="cash.receipt"><OrderCardModal readOnly /></Guard>} />
        <Route path="/orders/:no/pay" element={<Guard need="orders.pay"><PaymentModal /></Guard>} />
        <Route path="/orders/:no/refund" element={<Guard need="orders.refund"><RefundModal /></Guard>} />

        <Route path="/clients/new" element={<Guard need="clients.create"><ClientModal /></Guard>} />
        <Route path="/clients/:id" element={<Guard need="clients.view"><ClientModal /></Guard>} />

        <Route path="/cash/deposit" element={<Guard need="cash.deposit"><DepositModal /></Guard>} />
        <Route path="/cash/collect" element={<Guard need="cash.collect"><CollectionModal /></Guard>} />
        <Route path="/cash/close" element={<Guard need="shift.close"><ShiftCloseModal /></Guard>} />
        <Route path="/cash/report" element={<Guard need="shift.report"><ShiftReportModal /></Guard>} />

        <Route path="/directories/item/:id" element={<Guard need="catalog.view"><CatalogItemModal /></Guard>} />
        <Route path="/directories/item/:id/delete" element={<Guard need="catalog.delete"><ConfirmDeleteModal /></Guard>} />
        <Route path="/directories/:tab/new/:category" element={<Guard need="catalog.edit"><CatalogItemModal /></Guard>} />

        <Route path="/settings/users/:id" element={<Guard need="settings.usersView"><UserModal /></Guard>} />
        <Route path="/settings/roles/:name" element={<Guard need="settings.roles"><RoleModal /></Guard>} />

        <Route path="/logout" element={<LogoutModal />} />
        <Route path="*" element={null} />
      </Routes>
    </>
  )
}
