import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { buildAnalyticsSummary, enrichCommentsWithAspects } from '../services/analyticsService'

const recommendations = {
  sentiment: [
    'Monitor delivery-related complaints closely because they often signal churn risk.',
    'Use weekly sentiment snapshots to target support follow-ups before issues escalate.',
  ],
  aspects: [
    'Track the most repeated concerns by aspect to prioritize operational improvements.',
    'Compare product-quality versus pricing feedback to identify where the product journey needs attention.',
  ],
  trends: [
    'Use trend charts to spot the earliest signs of customer dissatisfaction.',
    'Compare month-over-month sentiment to evaluate the impact of new promotions or service changes.',
  ],
  alerts: [
    'Configure alert thresholds for sudden negative spikes in specific aspects.',
    'Escalate high-severity warnings to the owner when sentiment drops quickly.',
  ],
  reports: [
    'Export monthly summaries for stakeholder reviews and thesis reporting.',
    'Keep a consistent report cadence so sentiment changes are easy to compare over time.',
  ],
  businesses: [
    'Add at least one business profile before connecting social media sources.',
    'Keep each business description up to date so reporting stays context-rich.',
  ],
  settings: [
    'Set preferred alert thresholds and social integrations for each business.',
    'Review permissions regularly to keep the analytics workspace secure.',
  ],
}

export default function FeaturePage({ title, subtitle }) {
  const { selectedBusinessData } = useOutletContext()
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
  const analytics = useMemo(() => buildAnalyticsSummary(comments), [comments])

  const routeKey = title.toLowerCase().includes('sentiment')
    ? 'sentiment'
    : title.toLowerCase().includes('aspect')
      ? 'aspects'
      : title.toLowerCase().includes('trend')
        ? 'trends'
        : title.toLowerCase().includes('alert')
          ? 'alerts'
          : title.toLowerCase().includes('report')
            ? 'reports'
            : title.toLowerCase().includes('business')
              ? 'businesses'
              : 'settings'

  return (
    <section className="space-y-6">
      <SectionCard title={title} description={subtitle} className="shadow-xl shadow-black/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm text-white">
            Live insights · AfriBERTa-ready pipeline
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Business focus" description="Selected SME context for the current view.">
          <div className="space-y-2 text-sm text-muted">
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-semibold text-white">{selectedBusinessData?.name || 'Your business'}</div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedBusinessData?.isDemo ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                {selectedBusinessData?.isDemo ? 'Demo business' : 'Live business'}
              </span>
            </div>
            <p>{selectedBusinessData?.description || 'Create a business profile to start personalizing this workspace.'}</p>
          </div>
        </SectionCard>

        <SectionCard title="Current signal" description="Derived from the available feedback records.">
          <div className="space-y-2 text-sm text-muted">
            <div className="font-semibold text-white">{analytics.totalComments} feedback items</div>
            <p>Top aspect: {analytics.topAspect}</p>
            <p>Positive sentiment: {analytics.sentiment.positive}%</p>
          </div>
        </SectionCard>

        <SectionCard title="Recommended actions" description="Next best actions for this module.">
          <ul className="space-y-2 text-sm text-muted">
            {recommendations[routeKey].map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Recent feedback" description="Sample customer comments linked to this business.">
        {comments.length ? (
          <div className="space-y-3">
            {comments.slice(0, 4).map((comment, index) => (
              <div key={`${comment.text}-${index}`} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
                <p className="leading-6 text-white/90">{comment.text}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">{comment.aspect}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">{comment.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No feedback yet" description="Once social comments or WhatsApp messages are connected, this panel will populate automatically." />
        )}
      </SectionCard>
    </section>
  )
}
