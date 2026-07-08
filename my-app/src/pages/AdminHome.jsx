import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminHome() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const res = await fetch('http://localhost:4000/businesses')
        if (!res.ok) throw new Error('Failed to load businesses')
        const data = await res.json()
        setBusinesses(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Unable to fetch businesses')
      } finally {
        setLoading(false)
      }
    }

    loadBusinesses()
  }, [])

  const goToUsers = (businessId) => {
    navigate(`/admin/users/${businessId}`)
  }

  const goToDashboard = (businessId) => {
    navigate(`/admin/dashboard/${businessId}`)
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-card/80 p-6 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Admin Home</h1>
          <p className="mt-2 text-sm text-muted">Select the business you want to manage. Use the actual business IDs from the list below.</p>
        </div>

        {loading ? (
          <div className="text-sm text-muted">Loading businesses…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
        ) : businesses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted">No businesses found.</div>
        ) : (
          <div className="grid gap-4">
            {businesses.map((business) => (
              <div key={business.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted">ID</p>
                    <p className="font-medium text-white">{business.id}</p>
                    <p className="text-sm text-gray-300">{business.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => goToDashboard(business.id)}
                      className="rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
                    >
                      View Dashboard
                    </button>
                    <button
                      onClick={() => goToUsers(business.id)}
                      className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                    >
                      Manage Admins
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
