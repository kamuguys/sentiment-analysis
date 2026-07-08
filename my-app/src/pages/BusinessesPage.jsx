import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { createBusiness, deleteBusiness, listBusinesses, updateBusiness } from '../services/businessService'

const emptyForm = {
  name: '',
  industry: 'Retail',
  description: '',
  connectedPlatforms: ['Facebook'],
}

export default function BusinessesPage() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [feedback, setFeedback] = useState('')

  async function loadBusinesses() {
    if (!user?.uid) return
    setLoading(true)
    const data = await listBusinesses(user.uid)
    setBusinesses(data)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    const runLoad = async () => {
      if (!user?.uid) {
        queueMicrotask(() => {
          if (!cancelled) {
            setBusinesses([])
            setLoading(false)
          }
        })
        return
      }

      queueMicrotask(() => {
        if (!cancelled) {
          setLoading(true)
        }
      })

      const data = await listBusinesses(user.uid)
      if (!cancelled) {
        setBusinesses(data)
        setLoading(false)
      }
    }

    void runLoad()

    return () => {
      cancelled = true
    }
  }, [user?.uid])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user?.uid) return

    setSaving(true)
    setFeedback('')

    try {
      if (editingId) {
        await updateBusiness(editingId, form)
        setFeedback('Business updated successfully')
      } else {
        await createBusiness(user.uid, form)
        setFeedback('Business created successfully')
      }

      setForm(emptyForm)
      setEditingId('')
      await loadBusinesses()
    } catch (error) {
      setFeedback(error.message || 'Unable to save business')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(businessId) {
    if (!window.confirm('Delete this business?')) return
    try {
      await deleteBusiness(businessId)
      await loadBusinesses()
      setFeedback('Business removed')
    } catch (error) {
      setFeedback(error.message || 'Unable to delete business')
    }
  }

  const summaryText = useMemo(() => {
    if (!businesses.length) return 'No businesses connected yet.'
    return `${businesses.length} business profile${businesses.length > 1 ? 's' : ''} ready for analysis.`
  }, [businesses.length])

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-card/70 p-6 shadow-xl shadow-black/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Businesses</h1>
            <p className="mt-1 text-sm text-muted">Create and maintain the SME business profiles that power your sentiment dashboard.</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            {summaryText}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-card/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your business profiles</h2>
              <p className="text-sm text-muted">Each record can later connect to Facebook and WhatsApp data sources.</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted">Loading businesses…</div>
          ) : null}

          {!loading && !businesses.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-muted">
              Add your first business to begin collecting insights.
            </div>
          ) : null}

          <div className="space-y-3">
            {businesses.map((business) => (
              <div key={business.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-semibold text-white">{business.name}</div>
                    <div className="mt-1 text-sm text-muted">{business.industry}</div>
                    <p className="mt-2 text-sm text-white/80">{business.description || 'No description added yet.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/80"
                      onClick={() => {
                        setEditingId(business.id)
                        setForm({
                          name: business.name,
                          industry: business.industry,
                          description: business.description,
                          connectedPlatforms: business.connectedPlatforms || ['Facebook'],
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-rose-500/20 px-3 py-1 text-sm text-rose-300"
                      onClick={() => handleDelete(business.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  {(business.connectedPlatforms || []).map((platform) => (
                    <span key={platform} className="rounded-full bg-white/10 px-3 py-1">{platform}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-card/70 p-5">
          <h2 className="text-lg font-semibold">{editingId ? 'Update business' : 'Create a new business'}</h2>
          <p className="mt-1 text-sm text-muted">Use this form to register a business profile for the analysis pipeline.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-2 block text-white/80">Business name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="e.g. Green Valley Farms"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-white/80">Industry</span>
              <input
                value={form.industry}
                onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Retail, Agriculture, Services"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-white/80">Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Describe the business and its customer experience focus"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-2 block text-white/80">Connected platforms</span>
              <input
                value={form.connectedPlatforms.join(', ')}
                onChange={(event) => setForm((prev) => ({ ...prev, connectedPlatforms: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Facebook, WhatsApp"
              />
            </label>

            {feedback ? <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted">{feedback}</div> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70"
              >
                {saving ? 'Saving…' : editingId ? 'Update business' : 'Create business'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId('')
                  setForm(emptyForm)
                  setFeedback('')
                }}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
