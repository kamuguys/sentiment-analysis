import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import KpiCard from '../../components/KpiCard'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

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
  const comments = selectedBusinessData?.comments || []
  const kpiTrend = selectedBusinessData?.kpiTrend || []
  const sentimentTrend = selectedBusinessData?.sentimentTrend || {}
  const aspects = selectedBusinessData?.aspects || []
  const warnings = selectedBusinessData?.warnings || []
  const languages = selectedBusinessData?.languages || []
  const modelMetrics = selectedBusinessData?.modelMetrics || []
  const modelComparison = selectedBusinessData?.modelComparison || []

  const totalComments = comments.length
  const positive = Math.round((comments.filter((s) => s.sentiment === 'positive').length / totalComments) * 100 || 0)
  const negative = Math.round((comments.filter((s) => s.sentiment === 'negative').length / totalComments) * 100 || 0)
  const neutral = 100 - positive - negative
  const sentimentData = sentimentTrend[trendRange] || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Comments" value={totalComments} change="+4%" data={kpiTrend} />
        <KpiCard title="Positive %" value={`${positive}%`} change="+2%" data={kpiTrend} color="#22C55E" />
        <KpiCard title="Negative %" value={`${negative}%`} change="-1%" data={kpiTrend} color="#EF4444" />
        <KpiCard title="Neutral %" value={`${neutral}%`} change="+0.4%" data={kpiTrend} color="#94A3B8" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="bg-card/70 p-5 rounded-3xl border border-white/10 shadow-xl shadow-black/10">
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
        </div>

        <div className="grid gap-4">
          <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Aspect Analysis</h3>
            <div className="space-y-4">
              {aspects.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{item.name}</span>
                    <span>{item.pos}% / {item.neg}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${item.pos}%` }} />
                    <div className="h-full bg-rose-400" style={{ width: `${item.neg}%` }} />
                    <div className="h-full bg-slate-500" style={{ width: `${item.neu}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Early Warning</h3>
            <div className="space-y-3">
              {warnings.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 p-4 bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted mt-1">{item.detail}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.severity === 'High' ? 'bg-rose-500/15 text-rose-300' : item.severity === 'Medium' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                      {item.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Language Analytics</h3>
            <div className="space-y-4">
              {languages.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm text-muted mb-2">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
            <div className="space-y-4">
              {modelMetrics.map((metric) => (
                <div key={metric.label} className="text-sm">
                  <div className="flex items-center justify-between mb-2 text-muted">
                    <span>{metric.label}</span>
                    <span>{Math.round(metric.value * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
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
          </div>
        </div>

        <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
          <ul className="space-y-3 text-sm text-muted">
            <li>Positive sentiment is strongest around product quality, but delivery complaints are a rising risk.</li>
            <li>Language analytics show strong English usage, while code-switching signals opportunity for regional messaging.</li>
            <li>Model performance stays above 80% and outperforms Naive Bayes and SVM on current sample data.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card/70 p-5 rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Recent Comments</h3>
          <ul className="space-y-3">
            {comments.slice(0, 6).map((c, idx) => (
              <li key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm leading-6">{c.text}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-3 py-1 ${sentimentBadge(c.sentiment)}`}>{c.sentiment}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">{c.aspect}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">{Math.round(c.confidence * 100)}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
