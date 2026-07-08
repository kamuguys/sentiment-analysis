import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const AlertManagement = () => {
  const { businessId } = useParams()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule: { type: 'sentiment_threshold', threshold: 60, field: 'label', operator: 'gt' },
    recipients: [],
  })

  useEffect(() => {
    fetchAlerts()
  }, [businessId])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:4000/alerts/${businessId}`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const data = await res.json()
      setAlerts(data.alerts || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:4000/alerts/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to create alert')
      setShowForm(false)
      setFormData({ name: '', description: '', rule: { type: 'sentiment_threshold', threshold: 60 }, recipients: [] })
      fetchAlerts()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="p-4">Loading alerts...</div>

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Alert Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Alert'}
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Alert Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Rule Type</label>
              <select
                value={formData.rule.type}
                onChange={(e) => setFormData({ ...formData, rule: { ...formData.rule, type: e.target.value } })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="sentiment_threshold">Sentiment Threshold</option>
                <option value="negative_spike">Negative Spike</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Threshold</label>
              <input
                type="number"
                value={formData.rule.threshold}
                onChange={(e) => setFormData({ ...formData, rule: { ...formData.rule, threshold: Number(e.target.value) } })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Alert
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{alert.name}</h3>
                <p className="text-gray-600 text-sm">{alert.description}</p>
                <p className="text-xs mt-2">
                  <span className={alert.enabled ? 'text-green-600' : 'text-red-600'}>
                    {alert.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {' | '}
                  <span className="text-gray-500">{alert.rule.type}</span>
                  {alert.rule.threshold && ` - Threshold: ${alert.rule.threshold}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertManagement
