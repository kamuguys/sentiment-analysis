import * as queueRepo from '../repositories/analysisQueueRepository.js'
import * as commentRepo from '../repositories/commentRepository.js'
import { createAIService } from '../integrations/ai/AIServiceFactory.js'

export async function processAnalysisJobs(jobs = []) {
  const ai = createAIService(process.env.AI_PROVIDER)
  const results = []

  for (const job of jobs) {
    const jobResults = { jobId: job.id, processed: [], errors: [], alerts: [] }
    try {
      const paths = job.commentPaths || []
      for (const p of paths) {
        try {
          const comment = await commentRepo.getCommentByPath(p)
          if (!comment) {
            jobResults.errors.push({ path: p, error: 'not found' })
            continue
          }

          const analysis = await ai.analyzeComment(comment.text || '')
          const aspects = await (ai.analyzeAspects ? ai.analyzeAspects(comment.text || '') : [])

          const updates = {
            sentiment: {
              label: analysis.sentiment,
              score: analysis.score,
              comparative: analysis.comparative,
              confidence: analysis.confidence,
              modelUsed: analysis.modelUsed,
              analyzedAt: new Date().toISOString(),
              aspects,
            },
          }

          const updated = await commentRepo.updateCommentByPath(p, updates)
          jobResults.processed.push({ path: p, commentId: updated.id })
        } catch (err) {
          jobResults.errors.push({ path: p, error: String(err) })
        }
      }

      await queueRepo.markAnalysisComplete(job.id)

      // Evaluate alerts after analysis completes
      if (job.businessId && jobResults.processed.length > 0) {
        try {
          const { evaluateAlertsForBusiness } = await import('../services/alertService.js')
          const triggered = await evaluateAlertsForBusiness(job.businessId, { limit: 50 })
          jobResults.alerts = triggered
        } catch (err) {
          console.warn('alert evaluation failed for business', job.businessId, err)
        }
      }
    } catch (err) {
      console.error('job processing failed', job.id, err)
      await queueRepo.markAnalysisFailed(job.id, String(err))
      jobResults.errors.push({ jobError: String(err) })
    }

    results.push(jobResults)
  }

  return results
}

export async function processPendingAnalysis(limit = 5) {
  const pending = await queueRepo.getPendingAnalysis(limit)
  if (!pending || pending.length === 0) return []
  return processAnalysisJobs(pending)
}

// Allow running as a script
if (process.argv[1] && process.argv[1].endsWith('processAnalysisQueue.js')) {
  ;(async () => {
    try {
      const r = await processPendingAnalysis(10)
      console.log('Processed:', JSON.stringify(r, null, 2))
      process.exit(0)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  })()
}
