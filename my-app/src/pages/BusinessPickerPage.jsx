import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function BusinessPickerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const res = await fetch('http://localhost:4000/businesses')
        if (!res.ok) throw new Error('Failed to fetch businesses')
        const data = await res.json()
        setBusinesses(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleSelectBusiness = (businessId) => {
    navigate(`/businesses/${businessId}`)
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Select a Business</h1>
          <p className="text-sm text-muted mt-1">Welcome, {user?.displayName || user?.email}</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('sme-demo-user')
            navigate('/auth', { replace: true })
          }}
          className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
        >
          Sign out
        </button>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted">Loading businesses...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            Error: {error}
          </div>
        )}

        {!loading && businesses.length === 0 && !error && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center">
            <p className="text-white/60">No businesses found. Contact your administrator.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((business) => (
            <button
              key={business.id}
              onClick={() => handleSelectBusiness(business.id)}
              className="text-left rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <h3 className="font-semibold text-white">{business.name}</h3>
              <p className="text-xs text-white/60 mt-1">{business.industry || 'Business'}</p>
              {business.connectedPlatforms && business.connectedPlatforms.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {business.connectedPlatforms.map((platform) => (
                    <span key={platform} className="inline-block rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                      {platform}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 text-xs text-white/40">{business.id}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
