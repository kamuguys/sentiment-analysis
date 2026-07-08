import { describe, expect, it } from 'vitest'
import { buildAnalyticsSummary } from './analyticsService'

describe('buildAnalyticsSummary', () => {
  it('computes sentiment percentages and dominant aspect from comments', () => {
    const comments = [
      { text: 'Great quality and fast delivery', sentiment: 'positive', aspect: 'Product Quality' },
      { text: 'Delivery was slow', sentiment: 'negative', aspect: 'Delivery' },
      { text: 'Service was okay', sentiment: 'neutral', aspect: 'Customer Service' },
    ]

    const summary = buildAnalyticsSummary(comments)

    expect(summary.totalComments).toBe(3)
    expect(summary.sentiment.positive).toBe(33)
    expect(summary.sentiment.negative).toBe(33)
    expect(summary.sentiment.neutral).toBe(33)
    expect(summary.topAspect).toBe('Product Quality')
  })

  it('infers sentiment from score when sentiment field is missing', () => {
    const comments = [
      { text: 'Great product', score: 2.5, aspect: 'Product Quality' },
      { text: 'Poor service', score: -1.8, aspect: 'Customer Service' },
      { text: 'It was okay', score: 0, aspect: 'Other' },
    ]

    const summary = buildAnalyticsSummary(comments)

    expect(summary.totalComments).toBe(3)
    expect(summary.sentiment.positive).toBe(33)
    expect(summary.sentiment.negative).toBe(33)
    expect(summary.sentiment.neutral).toBe(33)
  })

  it('defaults to neutral sentiment when score is missing', () => {
    const comments = [
      { text: 'No sentiment data', aspect: 'Other' },
      { text: 'Also no sentiment', aspect: 'Other' },
    ]

    const summary = buildAnalyticsSummary(comments)

    expect(summary.totalComments).toBe(2)
    expect(summary.sentiment.neutral).toBe(100)
  })
})
