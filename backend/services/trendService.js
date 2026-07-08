import * as commentRepo from '../repositories/commentRepository.js'
import * as trendRepo from '../repositories/trendRepository.js'

function getBucket(date, period = 'daily') {
  const d = new Date(date)
  if (period === 'daily') {
    return d.toISOString().split('T')[0]
  }
  if (period === 'weekly') {
    const week = Math.floor((d.getDate() - d.getDay() + 1) / 7)
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
  }
  if (period === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  return d.toISOString().split('T')[0]
}

export async function computeTrends(businessId, period = 'daily', limit = 100) {
  if (!businessId) throw new Error('businessId is required')

  const comments = await commentRepo.getCommentsByBusiness(businessId, limit)
  if (!comments.length) return []

  const buckets = {}
  comments.forEach((c) => {
    const bucket = getBucket(c.createdAt || new Date(), period)
    if (!buckets[bucket]) {
      buckets[bucket] = { positive: 0, negative: 0, neutral: 0, scores: [] }
    }

    const label = c.sentiment?.label || 'neutral'
    buckets[bucket][label]++
    if (c.sentiment?.score) {
      buckets[bucket].scores.push(c.sentiment.score)
    }
  })

  const trends = []
  for (const [bucket, data] of Object.entries(buckets)) {
    const total = data.positive + data.negative + data.neutral
    const avgScore = data.scores.length ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0

    const trend = await trendRepo.storeTrendAggregate(businessId, {
      period,
      bucket,
      count: total,
      positive: data.positive,
      negative: data.negative,
      neutral: data.neutral,
      avgScore: Number(avgScore.toFixed(2)),
    })
    trends.push(trend)
  }

  return trends
}

export async function getTrendChart(businessId, period = 'daily', limit = 30) {
  if (!businessId) throw new Error('businessId is required')

  const trends = await trendRepo.getTrendsByPeriod(businessId, period, limit)
  return trends.map((t) => ({
    bucket: t.bucket,
    positive: t.positive,
    negative: t.negative,
    neutral: t.neutral,
    total: t.count,
    avgScore: t.avgScore,
  }))
}
