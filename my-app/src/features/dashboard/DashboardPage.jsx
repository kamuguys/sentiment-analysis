import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ResponsiveContainer, Line, LineChart, Tooltip, XAxis } from 'recharts'
import EmptyState from '../../components/EmptyState'
import KpiCard from '../../components/KpiCard'
import SectionCard from '../../components/SectionCard'
import { buildAnalyticsSummary, enrichCommentsWithAspects } from '../../services/analyticsService'

function sentimentBadge(sentiment) {
  const map = {
    positive: 'bg-emerald-500/15 text-emerald-300',
    negative: 'bg-rose-500/15 text-rose-300',
    neutral: 'bg-slate-500/15 text-slate-300',
  }
  return map[sentiment] || 'bg-white/10 text-white'
}

export default function DashboardPage() {
  const { selectedBusinessData } = useOutletContext()
  const [trendRange, setTrendRange] = useState('Weekly')
  const [enrichedComments, setEnrichedComments] = useState([])
  
  const rawComments = useMemo(() => selectedBusinessData?.comments || [], [selectedBusinessData?.comments])
  
  useEffect(() => {
    const enrich = async () => {
      if (rawComments.length === 0) {
        setEnrichedComments([])
        return
      }
      
      try {
        const enriched = await enrichCommentsWithAspects(rawComments)
        setEnrichedComments(enriched)
      } catch (error) {
        console.error('Failed to enrich comments:', error)
        setEnrichedComments(rawComments)
      }
    }
    
    enrich()
  }, [rawComments])
  
  const comments = enrichedComments
  const kpiTrend = selectedBusinessData?.kpiTrend || []
  const sentimentTrend = selectedBusinessData?.sentimentTrend || {}
  const aspects = selectedBusinessData?.aspects || []
  const warnings = selectedBusinessData?.warnings || []
  const languages = selectedBusinessData?.languages || []
  const modelMetrics = selectedBusinessData?.modelMetrics || []
  const modelComparison = selectedBusinessData?.modelComparison || []

  const analytics = useMemo(() => buildAnalyticsSummary(comments), [comments])
  const totalComments = analytics.totalComments
  const positive = analytics.sentiment.positive
  const negative = analytics.sentiment.negative
  const neutral = analytics.sentiment.neutral
  const sentimentData = sentimentTrend[trendRange] || []

  return (
    <div className="space-y-6">
      <SectionCard title={selectedBusinessData?.name || 'Selected business'} description={selectedBusinessData?.description || 'Your selected business profile for this workspace.'}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-muted">Business</div>
            <div className="text-lg font-semibold text-white">{selectedBusinessData?.name || 'Your business'}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedBusinessData?.isDemo ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                {selectedBusinessData?.isDemo ? 'Demo business' : 'Live business'}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-muted">{selectedBusinessData?.industry || 'Industry not set'}</span>
            <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-muted">{selectedBusinessData?.connectedPlatforms?.join(', ') || 'No platforms connected'}</span>
            <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-muted">{selectedBusinessData?.comments?.length || 0} feedback items</span>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard title="Total Comments" value={totalComments} change="Live" data={kpiTrend} />
        <KpiCard title="Positive %" value={`${positive}%`} change="+2%" data={kpiTrend} color="#22C55E" />
        <KpiCard title="Negative %" value={`${negative}%`} change="-1%" data={kpiTrend} color="#EF4444" />
        <KpiCard title="Neutral %" value={`${neutral}%`} change="+0.4%" data={kpiTrend} color="#94A3B8" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <SectionCard title="Sentiment Trend Analysis" description="Weekly sentiment momentum for your selected business." className="shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Sentiment Trend Analysis</h3>
              <p className="text-sm text-muted">Weekly sentiment momentum for your selected business.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-2 text-sm text-white">
              {Object.keys(sentimentTrend).map((range) => (
                <button
                  key={range}
                  onClick={() => setTrendRange(range)}
                  className={`rounded-full px-3 py-1 transition ${trendRange === range ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentData}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1F2937' }} />
                <Line type="monotone" dataKey="positive" stroke="#22C55E" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#94A3B8" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard title="Aspect Analysis" description="Distribution of feedback by business concern.">
            <div className="space-y-4">
              {aspects.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{item.name}</span>
                    <span>{item.pos}% / {item.neg}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-emerald-400" style={{ width: `${item.pos}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${item.neg}%` }} />
                    <div className="h-full bg-slate-500" style={{ width: `${item.neu}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Early Warning" description="Signals that deserve attention from the business owner.">
            <div className="space-y-3">
              {warnings.length ? (
                warnings.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="mt-1 text-sm text-muted">{item.detail}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.severity === 'High' ? 'bg-rose-500/15 text-rose-300' : item.severity === 'Medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No warnings yet" description="Your first alerts will appear when customer sentiment shifts." />
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard title="Language Analytics" description="Feedback distribution across languages and local dialects.">
            <div className="space-y-4">
              {languages.map((item) => (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm text-muted">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-emerald-400" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Model Performance" description="Quality of the current AfriBERTa-style inference path.">
            <div className="space-y-4">
              {modelMetrics.map((metric) => (
                <div key={metric.label} className="text-sm">
                  <div className="mb-2 flex items-center justify-between text-muted">
                    <span>{metric.label}</span>
                    <span>{Math.round(metric.value * 100)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-emerald-400" style={{ width: `${metric.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 text-sm">
              {modelComparison.map((entry) => (
                <div key={entry.model} className="flex items-center justify-between text-white/80">
                  <span>{entry.model}</span>
                  <span>{Math.round(entry.score * 100)}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="AI Insights" description="The current sentiment summary for the selected business.">
          <ul className="space-y-3 text-sm text-muted">
            <li>Most feedback is currently centered around {analytics.topAspect || 'the latest customer comments'}.</li>
            <li>Positive sentiment is strongest around product quality, while delivery concerns remain a key watch area.</li>
            <li>The current analytics flow is ready for future FastAPI-based inference and live Firestore ingestion.</li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Recent Comments" description="Latest customer observations captured for this business.">
        {comments.length ? (
          <ul className="space-y-3">
            {comments.slice(0, 6).map((comment, index) => (
              <li key={`${comment.text}-${index}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm leading-6">{comment.text}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-3 py-1 ${sentimentBadge(comment.sentiment)}`}>{comment.sentiment}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">{comment.aspect}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">{Math.round(comment.confidence * 100)}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No comments yet" description="Once customer feedback is imported, the latest comments will appear here." />
        )}
      </SectionCard>
    </div>
  )
}
