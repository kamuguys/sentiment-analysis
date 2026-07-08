import { db } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

export async function storeTrendAggregate(businessId, trend = {}) {
  if (!businessId || !trend.period || !trend.bucket) throw new Error('businessId, period, and bucket are required')

  try {
    const ref = db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('trends').doc(`${trend.period}-${trend.bucket}`)
    const payload = {
      period: trend.period,
      bucket: trend.bucket,
      count: trend.count || 0,
      positive: trend.positive || 0,
      negative: trend.negative || 0,
      neutral: trend.neutral || 0,
      avgScore: trend.avgScore || 0,
      computedAt: new Date().toISOString(),
    }

    await ref.set(payload, { merge: true })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() }
  } catch (err) {
    console.warn('Firestore unavailable for trend store', err.message)
    return { id: `${trend.period}-${trend.bucket}`, ...trend }
  }
}

export async function getTrendsByPeriod(businessId, period = 'daily', limit = 30) {
  if (!businessId || !period) throw new Error('businessId and period are required')

  try {
    const snapshot = await db
      .collection(COLLECTIONS.BUSINESSES)
      .doc(businessId)
      .collection('trends')
      .where('period', '==', period)
      .limit(limit)
      .get()

    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.bucket < b.bucket ? 1 : a.bucket > b.bucket ? -1 : 0))
      .slice(0, limit)
  } catch (err) {
    console.warn('Firestore unavailable for trends lookup', err.message)
    return []
  }
}

export async function getTrendAggregate(businessId, period, bucket) {
  if (!businessId || !period || !bucket) throw new Error('businessId, period, and bucket are required')

  const snap = await db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('trends').doc(`${period}-${bucket}`).get()
  return snap.exists ? { id: snap.id, ...snap.data() } : null
}
