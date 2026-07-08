import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

export default function AdminUsers() {
  const { businessId: routeBusinessId } = useParams()
  const [form, setForm] = useState({ uid: '', email: '', businessId: routeBusinessId || '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const adminSession = JSON.parse(localStorage.getItem('admin-session') || '{}')
      const res = await fetch('http://localhost:4000/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token || ''}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.admin)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Admin Users</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <label className="block">
          <div className="text-sm text-gray-600">UID (optional)</div>
          <input value={form.uid} onChange={(e) => setForm((s) => ({ ...s, uid: e.target.value }))} className="w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600">Email (optional)</div>
          <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} className="w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600">Business ID</div>
          <input value={form.businessId} onChange={(e) => setForm((s) => ({ ...s, businessId: e.target.value }))} className="w-full rounded border px-3 py-2" />
        </label>

        <div>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving…' : 'Create / Update Admin'}</button>
        </div>
      </form>

      {error && <div className="mt-4 text-red-600">Error: {error}</div>}
      {result && (
        <div className="mt-4 bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Admin saved</div>
          <pre className="text-xs mt-2">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
