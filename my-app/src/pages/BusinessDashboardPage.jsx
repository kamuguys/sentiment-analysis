import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import KpiCard from '../components/KpiCard'
import SectionCard from '../components/SectionCard'
import { buildAnalyticsSummary, enrichCommentsWithAspects } from '../services/analyticsService'
import { useAuth } from '../hooks/useAuth'

function sentimentBadge(sentiment) {
  const map = {
    positive: 'bg-emerald-500/15 text-emerald-300',
    negative: 'bg-rose-500/15 text-rose-300',
    neutral: 'bg-slate-500/15 text-slate-300',
  }
  return map[sentiment] || 'bg-white/10 text-white'
}

export default function BusinessDashboardPage() {
  const { businessId } = useParams()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trendRange, setTrendRange] = useState('Weekly')
  const [enrichedComments, setEnrichedComments] = useState([])

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(`http://localhost:4000/businesses/${businessId}`)
        if (!res.ok) throw new Error('Business not found')
        const data = await res.json()
        setBusiness(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      fetchBusiness()
    }
  }, [businessId])

  useEffect(() => {
    const enrich = async () => {
      const rawComments = business?.comments || business?.analytics?.comments || []
      if (rawComments.length === 0) {
        setEnrichedComments([])
        return
      }

      try {
        const enriched = await enrichCommentsWithAspects(rawComments)
        setEnrichedComments(enriched)
      } catch (err) {
        console.error('Failed to enrich comments:', err)
        setEnrichedComments(rawComments)
      }
    }

    enrich()
  }, [business?.comments, business?.analytics?.comments])

  const comments = enrichedComments
  const analytics = business?.analytics || {}
  const kpiTrend = business?.kpiTrend || [{ name: 'Live', v: 0 }]
  const sentimentTrend = business?.sentimentTrend || {}
  const aspects = business?.aspects || []

  const summary = useMemo(() => buildAnalyticsSummary(comments), [comments])
  const totalComments = summary.totalComments
  const positive = summary.sentiment.positive
  const negative = summary.sentiment.negative
  const neutral = summary.sentiment.neutral
  const sentimentData = sentimentTrend[trendRange] || []

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-muted">Loading business...</div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background text-white">
        <div className="p-6">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 mb-4">
            {error || 'Business not found'}
          </div>
          <button
            onClick={() => navigate('/business-picker')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Back to Business Picker
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex">
        <aside className="hidden md:block w-72">
          <Sidebar />
        </aside>
        <div className="flex-1 min-h-screen flex flex-col">
          <Header
            user={user}
            onSignOut={signOut}
            selectedBusiness={businessId}
            businesses={[{ id: businessId, name: business.name }]}
          />
          <main className="p-4 md:p-8">
            <div className="space-y-6">
              <SectionCard
                title={business.name}
                description={business.description || 'Sentiment analysis dashboard'}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-muted">Business</div>
                    <div className="text-lg font-semibold text-white">{business.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Live business
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-muted">
                      {business.industry || 'Industry not set'}
                    </span>
                    <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-muted">
                      {business.connectedPlatforms?.join(', ') || 'No platforms'}
                    </span>
                    <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-muted">
                      {comments.length || 0} feedback items
                    </span>
                  </div>
                </div>
              </SectionCard>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <KpiCard title="Total Comments" value={totalComments} change="Live" data={kpiTrend} />
                <KpiCard title="Positive %" value={`${positive}%`} change="+2%" data={kpiTrend} color="#22C55E" />
                <KpiCard title="Negative %" value={`${negative}%`} change="-1%" data={kpiTrend} color="#EF4444" />
                <KpiCard title="Neutral %" value={`${neutral}%`} change="+0.4%" data={kpiTrend} color="#94A3B8" />
              </div>

              {comments.length > 0 && (
                <SectionCard title="Recent Feedback" description="Latest comments and sentiment">
                  <div className="space-y-3">
                    {comments.slice(0, 10).map((comment, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-white/10 bg-white/5 p-3 flex gap-3"
                      >
                        <div className={`rounded-full px-2 py-1 text-xs font-semibold h-fit ${sentimentBadge(comment.sentiment)}`}>
                          {comment.sentiment}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{comment.text}</p>
                          {comment.aspect && (
                            <p className="text-xs text-muted mt-1">Aspect: {comment.aspect}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {comments.length === 0 && (
                <SectionCard title="No Data Yet" description="Feedback will appear here once analysis begins">
                  <div className="text-center py-8 text-muted">
                    Connect this business to Facebook, Instagram, or WhatsApp to begin collecting feedback.
                  </div>
                </SectionCard>
              )}

              <button
                onClick={() => navigate('/business-picker')}
                className="w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/80 hover:text-white"
              >
                Back to Business Picker
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
