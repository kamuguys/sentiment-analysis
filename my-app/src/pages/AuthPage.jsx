import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const initialState = {
  email: '',
  password: '',
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, error, setError, demoMode } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialState)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        await signInWithEmail(form.email, form.password)
      } else {
        await signUpWithEmail(form.email, form.password)
      }
      navigate('/business-picker', { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')

    try {
      await signInWithGoogle()
      navigate('/business-picker', { replace: true })
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
            {demoMode ? 'Demo mode enabled' : 'Secure sign-in'}
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Welcome to Zambian SME Insights</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to manage your businesses, monitor sentiment, and track customer feedback from one place.
          </p>
        </div>

        <div className="mb-5 flex rounded-2xl bg-white/5 p-1">
          <button
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm transition ${mode === 'login' ? 'bg-white text-slate-900' : 'text-white/80'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm transition ${mode === 'signup' ? 'bg-white text-slate-900' : 'text-white/80'}`}
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block text-white/80">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0"
              placeholder="manager@company.com"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-white/80">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0"
              placeholder="At least 6 characters"
            />
          </label>

          {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
          <span className="h-px flex-1 bg-white/10" />
          Or continue with
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Continue with Google
        </button>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-muted mb-3">Admin access?</p>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="text-sm text-purple-400 hover:text-purple-300 transition font-medium"
          >
            Go to Admin Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}

