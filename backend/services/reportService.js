import * as commentRepo from '../repositories/commentRepository.js'
import * as trendRepo from '../repositories/trendRepository.js'
import * as alertRepo from '../repositories/alertRepository.js'

export async function generateReport(businessId, options = {}) {
  if (!businessId) throw new Error('businessId is required')

  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date(), period = 'daily' } = options

  const comments = await commentRepo.getCommentsByBusiness(businessId, options.limit || 200)
  const trends = await trendRepo.getTrendsByPeriod(businessId, period, 30)
  const alerts = await alertRepo.getAlertsByBusiness(businessId)

  const filteredComments = comments.filter((c) => {
    const d = new Date(c.createdAt)
    return d >= startDate && d <= endDate
  })

  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 }
  const scores = []
  filteredComments.forEach((c) => {
    const label = c.sentiment?.label || 'neutral'
    sentimentCounts[label]++
    if (c.sentiment?.score) scores.push(c.sentiment.score)
  })

  const total = filteredComments.length || 1
  const report = {
    businessId,
    period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    summary: {
      totalComments: total,
      positive: { count: sentimentCounts.positive, percent: Math.round((sentimentCounts.positive / total) * 100) },
      negative: { count: sentimentCounts.negative, percent: Math.round((sentimentCounts.negative / total) * 100) },
      neutral: { count: sentimentCounts.neutral, percent: Math.round((sentimentCounts.neutral / total) * 100) },
      avgSentimentScore: scores.length ? Number((scores.reduce((a, b) => a + b) / scores.length).toFixed(2)) : 0,
    },
    trends: trends.slice(0, 10).map((t) => ({
      bucket: t.bucket,
      positive: t.positive,
      negative: t.negative,
      neutral: t.neutral,
      avgScore: t.avgScore,
    })),
    topComments: filteredComments.slice(0, 10).map((c) => ({
      text: c.text,
      sentiment: c.sentiment?.label || 'neutral',
      score: c.sentiment?.score || 0,
      author: c.author?.name || 'Anonymous',
      date: c.createdAt,
    })),
    alerts: {
      total: alerts.length,
      enabled: alerts.filter((a) => a.enabled).length,
    },
    generatedAt: new Date().toISOString(),
  }

  return report
}

export function reportToCSV(report) {
  if (!report) return ''

  const lines = []
  lines.push('SME Sentiment Analysis Report')
  lines.push(`Period: ${report.period}`)
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push('')

  lines.push('SUMMARY')
  lines.push(`Total Comments,${report.summary.totalComments}`)
  lines.push(`Positive,${report.summary.positive.count} (${report.summary.positive.percent}%)`)
  lines.push(`Negative,${report.summary.negative.count} (${report.summary.negative.percent}%)`)
  lines.push(`Neutral,${report.summary.neutral.count} (${report.summary.neutral.percent}%)`)
  lines.push(`Avg Sentiment Score,${report.summary.avgSentimentScore}`)
  lines.push('')

  lines.push('TRENDS')
  lines.push('Bucket,Positive,Negative,Neutral,Avg Score')
  report.trends.forEach((t) => {
    lines.push(`${t.bucket},${t.positive},${t.negative},${t.neutral},${t.avgScore}`)
  })
  lines.push('')

  lines.push('TOP COMMENTS')
  lines.push('Text,Sentiment,Score,Author,Date')
  report.topComments.forEach((c) => {
    const text = c.text.replace(/"/g, '""').replace(/,/g, ' ')
    lines.push(`"${text}",${c.sentiment},${c.score},${c.author},${c.date}`)
  })

  return lines.join('\n')
}
