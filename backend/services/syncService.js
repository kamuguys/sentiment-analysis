import * as commentRepo from '../repositories/commentRepository.js'
import * as queueRepo from '../repositories/analysisQueueRepository.js'

// comments: array of { id (externalId), message/text, created_time, from, platform }
export async function syncAndEnqueueComments(businessId, accountId, comments = []) {
  if (!businessId || !accountId) throw new Error('businessId and accountId required')
  if (!Array.isArray(comments) || comments.length === 0) return { inserted: 0, enqueued: 0 }

  const externalIds = comments.map((c) => c.id).filter(Boolean)
  const existing = externalIds.length ? await commentRepo.getCommentsByExternalIds(externalIds, businessId, accountId) : []
  const existingIds = new Set(existing.map((e) => e.externalId))

  const newComments = comments.filter((c) => !existingIds.has(c.id))
  if (newComments.length === 0) return { inserted: 0, enqueued: 0 }

  const createdPaths = await commentRepo.batchInsertComments(businessId, accountId, newComments)
  // enqueue for analysis
  if (createdPaths && createdPaths.length) {
    const job = await queueRepo.enqueueAnalysis(businessId, createdPaths)
    return { inserted: createdPaths.length, enqueued: 1, jobId: job.id }
  }

  return { inserted: 0, enqueued: 0 }
}
