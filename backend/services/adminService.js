export async function getDashboardMetrics(businessId) {
  if (!businessId) throw new Error('businessId is required')

  // This would fetch from repositories in a real implementation
  // For now, return a metrics schema
  return {
    businessId,
    totalComments: 0,
    sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
    avgSentimentScore: 0,
    activeAlerts: 0,
    triggeredAlerts: 0,
    queueStatus: { pending: 0, processing: 0, completed: 0 },
    lastAnalyzedAt: new Date().toISOString(),
  }
}
