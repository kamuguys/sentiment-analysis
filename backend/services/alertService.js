import * as commentRepo from '../repositories/commentRepository.js'
import * as alertRepo from '../repositories/alertRepository.js'

export async function evaluateAlertsForBusiness(businessId, options = {}) {
  if (!businessId) throw new Error('businessId is required')

  const alerts = await alertRepo.getAlertsByBusiness(businessId)
  const enabledAlerts = alerts.filter((a) => a.enabled)
  if (!enabledAlerts.length) return []

  const recentComments = await commentRepo.getCommentsByBusiness(businessId, options.limit || 100)
  const triggeredAlerts = []

  for (const alert of enabledAlerts) {
    const triggered = await evaluateAlertRule(alert, recentComments)
    if (triggered) {
      const trigger = await alertRepo.createAlertTrigger(businessId, alert.id, {
        conditionMet: true,
        dataSnapshot: triggered.snapshot,
        message: triggered.message,
      })
      triggeredAlerts.push({ alert, trigger })
    }
  }

  return triggeredAlerts
}

async function evaluateAlertRule(alert, comments) {
  if (!alert.rule || !comments.length) return null

  const { type, threshold, field, operator } = alert.rule

  if (type === 'sentiment_threshold') {
    return evaluateSentimentThreshold(alert, comments, threshold, field, operator)
  }

  if (type === 'negative_spike') {
    return evaluateNegativeSpike(alert, comments, threshold)
  }

  return null
}

function evaluateSentimentThreshold(alert, comments, threshold, field = 'label', operator = 'gt') {
  if (field === 'label') {
    const negativeCount = comments.filter((c) => c.sentiment?.label === 'negative').length
    const total = Math.max(1, comments.length)
    const negativePercent = (negativeCount / total) * 100

    const passes = operator === 'gt' ? negativePercent > threshold : negativePercent >= threshold

    if (passes) {
      return {
        snapshot: { negativePercent, negativeCount, total },
        message: `${alert.name}: negative sentiment ${negativePercent.toFixed(1)}% exceeds threshold ${threshold}%`,
      }
    }
  }

  if (field === 'score') {
    const scores = comments.filter((c) => c.sentiment?.score).map((c) => c.sentiment.score)
    if (scores.length === 0) return null

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const passes = operator === 'lt' ? avgScore < threshold : avgScore <= threshold

    if (passes) {
      return {
        snapshot: { avgScore, scoreCount: scores.length },
        message: `${alert.name}: average sentiment score ${avgScore.toFixed(2)} below threshold ${threshold}`,
      }
    }
  }

  return null
}

function evaluateNegativeSpike(alert, comments, threshold) {
  if (comments.length < 2) return null

  const recent = comments.slice(0, Math.ceil(comments.length / 2))
  const older = comments.slice(Math.ceil(comments.length / 2))

  const recentNegative = recent.filter((c) => c.sentiment?.label === 'negative').length / Math.max(1, recent.length)
  const olderNegative = older.filter((c) => c.sentiment?.label === 'negative').length / Math.max(1, older.length)
  const spike = recentNegative - olderNegative

  if (spike > threshold) {
    return {
      snapshot: { spike: spike.toFixed(2), recent: recentNegative.toFixed(2), older: olderNegative.toFixed(2) },
      message: `${alert.name}: negative sentiment spike detected (${(spike * 100).toFixed(1)}% increase)`,
    }
  }

  return null
}
