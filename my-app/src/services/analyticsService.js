/**
 * Infer sentiment from comment score if sentiment field is missing.
 * Score comes from the backend's Sentiment npm package analysis.
 */
function inferSentimentFromScore(comment) {
  if (comment.sentiment) {
    return comment.sentiment
  }
  
  if (typeof comment.score === 'number') {
    if (comment.score > 0) return 'positive'
    if (comment.score < 0) return 'negative'
    return 'neutral'
  }
  
  return 'neutral'
}

export function buildAnalyticsSummary(comments = []) {
  const totalComments = comments.length
  const counts = { positive: 0, negative: 0, neutral: 0 }
  const aspectCounts = new Map()
  const aspectOrder = []

  comments.forEach((comment) => {
    const sentiment = inferSentimentFromScore(comment)
    if (sentiment in counts) {
      counts[sentiment] += 1
    }

    const aspect = comment.aspect || 'Other'
    if (!aspectCounts.has(aspect)) {
      aspectCounts.set(aspect, 0)
      aspectOrder.push(aspect)
    }
    aspectCounts.set(aspect, aspectCounts.get(aspect) + 1)
  })

  const sentiment = {
    positive: totalComments ? Math.round((counts.positive / totalComments) * 100) : 0,
    negative: totalComments ? Math.round((counts.negative / totalComments) * 100) : 0,
    neutral: totalComments ? Math.round((counts.neutral / totalComments) * 100) : 0,
  }

  const aspectBreakdown = aspectOrder
    .map((aspect) => ({ name: aspect, count: aspectCounts.get(aspect) }))
    .sort((left, right) => right.count - left.count || aspectOrder.indexOf(left.name) - aspectOrder.indexOf(right.name))

  return {
    totalComments,
    sentiment,
    topAspect: aspectBreakdown[0]?.name || 'Other',
    aspectBreakdown,
  }
}

/**
 * Enrich comments with aspect and confidence labels using AfriBERTa mock.
 * Fills in missing aspect fields for real backend comments.
 */
export async function enrichCommentsWithAspects(comments = []) {
  const { batchAnalyze } = await import('./afriberte.js')
  
  const enriched = await Promise.all(
    comments.map(async (comment) => {
      if (comment.aspect) {
        return comment
      }
      
      try {
        const [analysis] = await batchAnalyze([comment])
        return {
          ...comment,
          aspect: analysis.aspect || comment.aspect || 'Other',
          confidence: analysis.confidence || comment.confidence,
        }
      } catch {
        return { ...comment, aspect: 'Other', confidence: 0.5 }
      }
    })
  )
  
  return enriched
}
