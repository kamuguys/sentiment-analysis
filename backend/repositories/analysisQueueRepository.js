import { db } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

export async function enqueueAnalysis(businessId, commentPaths = []) {
  const ref = db.collection(COLLECTIONS.ANALYSIS_QUEUE).doc()
  const payload = {
    businessId,
    commentPaths,
    status: 'pending',
    queuedAt: new Date().toISOString(),
  }
  await ref.set(payload)
  const snap = await ref.get()
  return { id: ref.id, ...snap.data() }
}

export async function getPendingAnalysis(limit = 10) {
  try {
    const snapshot = await db.collection(COLLECTIONS.ANALYSIS_QUEUE)
      .where('status', '==', 'pending')
      .limit(limit)
      .get()
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('Firestore unavailable for pending analysis lookup', err.message)
    return []
  }
}

export async function claimPendingAnalysis(limit = 5, processorId = 'worker') {
  const queueRef = db.collection(COLLECTIONS.ANALYSIS_QUEUE)
  const snapshot = await queueRef.where('status', '==', 'pending').orderBy('queuedAt', 'asc').limit(limit).get()
  const claimed = []

  for (const doc of snapshot.docs) {
    const ref = doc.ref
    const data = doc.data()
    if (data.status !== 'pending') continue

    try {
      await db.runTransaction(async (transaction) => {
        const fresh = await transaction.get(ref)
        if (!fresh.exists) return
        const freshData = fresh.data()
        if (freshData.status !== 'pending') return

        transaction.update(ref, {
          status: 'processing',
          processorId,
          startedAt: new Date().toISOString(),
        })
      })
      claimed.push({ id: doc.id, ...data })
    } catch (error) {
      console.warn(`failed to claim queue item ${doc.id}`, error)
    }
  }

  return claimed
}

export async function markAnalysisComplete(id) {
  const ref = db.collection(COLLECTIONS.ANALYSIS_QUEUE).doc(id)
  await ref.update({ status: 'completed', completedAt: new Date().toISOString() })
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}

export async function markAnalysisFailed(id, error) {
  const ref = db.collection(COLLECTIONS.ANALYSIS_QUEUE).doc(id)
  await ref.update({ status: 'failed', errorMessage: error, completedAt: new Date().toISOString() })
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}
