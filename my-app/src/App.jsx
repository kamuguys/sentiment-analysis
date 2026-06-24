import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './features/dashboard/DashboardPage'
import DefaultLayout from './layouts/DefaultLayout'
import FeaturePage from './pages/FeaturePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="sentiment" element={<FeaturePage title="Sentiment Analysis" subtitle="Deep sentiment scoring for Zambia SMEs." />} />
          <Route path="aspects" element={<FeaturePage title="Aspect Analysis" subtitle="Analyze product, pricing, delivery, and service segments." />} />
          <Route path="trends" element={<FeaturePage title="Trend Analysis" subtitle="Track sentiment momentum across days, weeks, and quarters." />} />
          <Route path="alerts" element={<FeaturePage title="Alerts" subtitle="Real-time early warning signals for reputation risk." />} />
          <Route path="reports" element={<FeaturePage title="Reports" subtitle="Export sentiment summaries and performance dashboards." />} />
          <Route path="businesses" element={<FeaturePage title="Businesses" subtitle="Manage multiple SME profiles and business accounts." />} />
          <Route path="settings" element={<FeaturePage title="Settings" subtitle="Configure alerts, teams, and data sources." />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
