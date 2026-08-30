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
import { UserModal } from './screens/UserModal'
import { ConfirmDeleteModal } from './screens/ConfirmDeleteModal'
import { useStore } from './state/store'

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

          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<OrdersPage />} />
          <Route path="/orders/:no" element={<OrdersPage />} />
          <Route path="/orders/:no/view" element={<OrdersPage />} />
          <Route path="/orders/:no/pay" element={<OrdersPage />} />
          <Route path="/orders/:no/refund" element={<OrdersPage />} />

          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/new" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientsPage />} />

          <Route path="/cash" element={<CashPage />} />
          <Route path="/cash/:tab" element={<CashPage />} />
          <Route path="/cash/deposit" element={<CashPage />} />
          <Route path="/cash/collect" element={<CashPage />} />
          <Route path="/cash/close" element={<CashPage />} />
          <Route path="/cash/report" element={<CashPage />} />

          <Route path="/directories" element={<DirectoriesPage />} />
          <Route path="/directories/item/:id" element={<DirectoriesPage />} />
          <Route path="/directories/item/:id/delete" element={<DirectoriesPage />} />
          <Route path="/directories/:tab" element={<DirectoriesPage />} />
          <Route path="/directories/:tab/new/:category" element={<DirectoriesPage />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/users/:id" element={<SettingsPage />} />
          <Route path="/settings/:tab" element={<SettingsPage />} />

          <Route path="/logout" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      {/* The overlay layer — every «формат А» window. */}
      <Routes>
        <Route path="/orders/new" element={<OrderCreateModal />} />
        <Route path="/orders/:no" element={<OrderCardModal />} />
        <Route path="/orders/:no/view" element={<OrderCardModal readOnly />} />
        <Route path="/orders/:no/pay" element={<PaymentModal />} />
        <Route path="/orders/:no/refund" element={<RefundModal />} />

        <Route path="/clients/new" element={<ClientModal />} />
        <Route path="/clients/:id" element={<ClientModal />} />

        <Route path="/cash/deposit" element={<DepositModal />} />
        <Route path="/cash/collect" element={<CollectionModal />} />
        <Route path="/cash/close" element={<ShiftCloseModal />} />
        <Route path="/cash/report" element={<ShiftReportModal />} />

        <Route path="/directories/item/:id" element={<CatalogItemModal />} />
        <Route path="/directories/item/:id/delete" element={<ConfirmDeleteModal />} />
        <Route path="/directories/:tab/new/:category" element={<CatalogItemModal />} />

        <Route path="/settings/users/:id" element={<UserModal />} />

        <Route path="/logout" element={<LogoutModal />} />
        <Route path="*" element={null} />
      </Routes>
    </>
  )
}
