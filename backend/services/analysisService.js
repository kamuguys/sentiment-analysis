import { createAIService } from '../integrations/ai/AIServiceFactory.js'
import * as commentRepo from '../repositories/commentRepository.js'

export async function analyzeRecentCommentsForBusiness(businessId, options = { limit: 50 }) {
  const ai = createAIService(process.env.AI_PROVIDER)
  const comments = await commentRepo.getCommentsByBusiness(businessId, options.limit || 50)

  const results = []
  for (const c of comments) {
    try {
      const analysis = await ai.analyzeComment(c.text || '')
      const aspectAnalysis = await ai.analyzeAspects ? await ai.analyzeAspects(c.text || '') : []
      const updates = {
        sentiment: {
          label: analysis.sentiment,
          score: analysis.score,
          comparative: analysis.comparative,
          confidence: analysis.confidence,
          modelUsed: analysis.modelUsed,
          analyzedAt: new Date().toISOString(),
          aspects: aspectAnalysis,
        },
      }

      // write back to Firestore
      const updated = await commentRepo.updateCommentByPath(c._path, updates)
      results.push({ commentId: c.id, updated })
    } catch (err) {
      console.error('analysis error for comment', c.id, err)
      results.push({ commentId: c.id, error: String(err) })
    }
  }

  return results
}
