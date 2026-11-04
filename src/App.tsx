import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { InventoryPage } from '@/pages/inventory/InventoryPage'
import { HardwareAssetsPage } from '@/pages/hardware-assets/HardwareAssetsPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { PurchaseRequestsPage } from '@/pages/purchase-requests/PurchaseRequestsPage'
import { ActivityLogPage } from '@/pages/activity-log/ActivityLogPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <ThemeProvider>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/hardware-assets" element={<HardwareAssetsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/purchase-requests" element={<PurchaseRequestsPage />} />
              <Route path="/activity-log" element={<ActivityLogPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
