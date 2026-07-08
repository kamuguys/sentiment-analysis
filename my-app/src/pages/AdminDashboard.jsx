import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const AdminDashboard = () => {
  const { businessId } = useParams()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportFormat, setReportFormat] = useState('json')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const adminSession = JSON.parse(localStorage.getItem('admin-session') || '{}')
        const res = await fetch(`http://localhost:4000/admin/dashboard/${businessId}`, {
          headers: {
            Authorization: `Bearer ${adminSession.token || ''}`,
          },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch dashboard')
        }
        setDashboard(data.dashboard)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      fetchDashboard()
    }
  }, [businessId])

  const handleExportReport = async (format) => {
    try {
      const adminSession = JSON.parse(localStorage.getItem('admin-session') || '{}')
      const res = await fetch(`http://localhost:4000/reports/${businessId}?format=${format}`, {
        headers: {
          Authorization: `Bearer ${adminSession.token || ''}`,
        },
      })
      if (!res.ok) throw new Error('Failed to export report')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${businessId}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="p-4">Loading dashboard...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!dashboard) return <div className="p-4">No dashboard data available</div>

  const { summary, trends, queueStatus } = dashboard

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Total Alerts</p>
          <p className="text-2xl font-bold">{summary.totalAlerts}</p>
          <p className="text-green-600 text-xs">{summary.enabledAlerts} enabled</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Recent Comments</p>
          <p className="text-2xl font-bold">{summary.recentComments}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Sentiment</p>
          <div className="flex gap-2 mt-2">
            <span className="text-green-600 font-semibold">{summary.sentimentBreakdown.positive}</span>
            <span className="text-red-600 font-semibold">{summary.sentimentBreakdown.negative}</span>
            <span className="text-gray-600 font-semibold">{summary.sentimentBreakdown.neutral}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Queue Status</p>
          <p className="text-2xl font-bold">{queueStatus.pending}</p>
          <p className="text-blue-600 text-xs">pending items</p>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">7-Day Sentiment Trend</h2>
        <div className="space-y-2">
          {trends.map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.bucket}</span>
              <div className="flex gap-2">
                <span className="text-green-600 text-sm">+{t.positive}</span>
                <span className="text-red-600 text-sm">-{t.negative}</span>
                <span className="text-gray-600 text-sm">={t.neutral}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Reports */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Export Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportReport('json')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExportReport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExportReport('pdf')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
