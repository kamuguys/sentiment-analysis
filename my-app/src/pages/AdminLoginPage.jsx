import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { auth, firebaseEnabled } from '../services/firebase'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { signInWithEmail } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', adminCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      let payload = {}

      if (firebaseEnabled && form.email && form.password) {
        await signInWithEmail(form.email, form.password)
        const idToken = await auth?.currentUser?.getIdToken()
        if (!idToken) {
          throw new Error('Unable to obtain a Firebase access token')
        }
        payload = { ...payload, idToken }
      } else if (form.adminCode.trim()) {
        payload = { ...payload, adminCode: form.adminCode }
      } else {
        throw new Error('Please provide either Firebase credentials or admin code')
      }

      const res = await fetch('http://localhost:4000/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Admin login failed')
      }

      localStorage.setItem('admin-session', JSON.stringify({
        adminCode: form.adminCode,
        email: form.email,
        token: data.token,
        provider: data.provider || (firebaseEnabled ? 'firebase' : 'demo'),
        timestamp: new Date().toISOString(),
      }))

      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Admin login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-purple-500/15 px-3 py-1 text-sm text-purple-300">
            Admin Access
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-muted">
            Access admin tools to manage alerts, view trends, and export reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {firebaseEnabled ? (
            <>
              <label className="block text-sm">
                <span className="mb-2 block text-white/80">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0"
                  placeholder="admin@example.com"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-2 block text-white/80">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0"
                  placeholder="Enter your Firebase password"
                />
              </label>

              <p className="text-xs text-gray-400 text-center py-2">— or use admin code below —</p>
            </>
          ) : null}

          <label className="block text-sm">
            <span className="mb-2 block text-white/80">Admin Code</span>
            <input
              type="password"
              value={form.adminCode}
              onChange={(event) => setForm((prev) => ({ ...prev, adminCode: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0"
              placeholder="Enter admin code"
            />
            <p className="text-xs text-gray-400 mt-1">Use this instead of Firebase credentials if you want quick access.</p>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple-500 px-4 py-3 font-semibold text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Verifying…' : 'Access Admin Dashboard'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="text-sm text-muted hover:text-white transition"
          >
            ← Back to user login
          </button>
        </div>
      </div>
    </div>
  )
}
