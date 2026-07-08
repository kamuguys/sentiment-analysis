import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import DashboardPage from './features/dashboard/DashboardPage'
import DefaultLayout from './layouts/DefaultLayout'
import AuthPage from './pages/AuthPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminHome from './pages/AdminHome'
import AlertManagement from './pages/AlertManagement'
import BusinessesPage from './pages/BusinessesPage'
import BusinessPickerPage from './pages/BusinessPickerPage'
import BusinessDashboardPage from './pages/BusinessDashboardPage'
import FeaturePage from './pages/FeaturePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <div className="rounded-3xl border border-white/10 bg-card/80 px-6 py-4 text-sm text-muted">Loading your workspace…</div>
      </div>
    )
  }

  return user ? children : <Navigate to="/auth" replace />
}

function AdminProtectedRoute({ children }) {
  const adminSession = JSON.parse(localStorage.getItem('admin-session') || 'null')

  if (!adminSession?.token) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminProtectedRoute><AdminHome /></AdminProtectedRoute>} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/business-picker" element={<ProtectedRoute><BusinessPickerPage /></ProtectedRoute>} />
      <Route path="/businesses/:businessId" element={<ProtectedRoute><BusinessDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard/:businessId" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/users/:businessId" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
      <Route path="/admin/alerts/:businessId" element={<AdminProtectedRoute><AlertManagement /></AdminProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><DefaultLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="sentiment" element={<FeaturePage title="Sentiment Analysis" subtitle="Deep sentiment scoring for Zambia SMEs." />} />
        <Route path="aspects" element={<FeaturePage title="Aspect Analysis" subtitle="Analyze product, pricing, delivery, and service segments." />} />
        <Route path="trends" element={<FeaturePage title="Trend Analysis" subtitle="Track sentiment momentum across days, weeks, and quarters." />} />
        <Route path="alerts" element={<FeaturePage title="Alerts" subtitle="Real-time early warning signals for reputation risk." />} />
        <Route path="reports" element={<FeaturePage title="Reports" subtitle="Export sentiment summaries and performance dashboards." />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="settings" element={<FeaturePage title="Settings" subtitle="Configure alerts, teams, and data sources." />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

