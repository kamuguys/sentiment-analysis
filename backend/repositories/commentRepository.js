import { db } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

function commentsCollectionRef(businessId, accountId) {
  if (accountId) {
    return db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection(COLLECTIONS.SOCIAL_ACCOUNTS).doc(accountId).collection(COLLECTIONS.COMMENTS)
  }
  return db.collectionGroup(COLLECTIONS.COMMENTS).where('businessId', '==', businessId)
}

export async function batchInsertComments(businessId, accountId, comments = []) {
  try {
    const batch = db.batch()
    const refBase = db.collection(COLLECTIONS.BUSINESSES).doc(businessId)
    const createdPaths = []
    for (const c of comments) {
      const docRef = refBase.collection(COLLECTIONS.SOCIAL_ACCOUNTS).doc(accountId).collection(COLLECTIONS.COMMENTS).doc()
      batch.set(docRef, {
        businessId,
        accountId,
        externalId: c.id || null,
        externalPostId: c.postId || null,
        platform: c.platform || 'facebook',
        text: c.message || c.text || '',
        author: c.from || null,
        sentiment: c.sentiment || null,
        importedAt: new Date().toISOString(),
        createdAt: c.created_time || c.createdAt || new Date().toISOString(),
      })
      createdPaths.push(docRef.path)
    }

    await batch.commit()
    return createdPaths
  } catch (err) {
    console.warn('Firestore unavailable for comment import', err.message)
    return []
  }
}

export async function getCommentsByExternalIds(externalIds = [], businessId, accountId) {
  if (!externalIds || externalIds.length === 0) return []
  try {
    const collRef = db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection(COLLECTIONS.SOCIAL_ACCOUNTS).doc(accountId).collection(COLLECTIONS.COMMENTS)
    const snapshot = await collRef.where('externalId', 'in', externalIds.slice(0, 10)).get()
    return snapshot.docs.map((d) => ({ id: d.id, _path: d.ref.path, ...d.data() }))
  } catch (err) {
    console.warn('Firestore unavailable for comment lookup', err.message)
    return []
  }
}

export async function getCommentsByBusiness(businessId, limit = 50) {
  try {
    const snapshot = await db.collectionGroup(COLLECTIONS.COMMENTS)
      .where('businessId', '==', businessId)
      .limit(limit)
      .get()
    return snapshot.docs.map((d) => ({ id: d.id, _path: d.ref.path, ...d.data() }))
  } catch (err) {
    console.warn('Firestore unavailable for business comments', err.message)
    return []
  }
}

export async function updateCommentByPath(docPath, updates) {
  try {
    const ref = db.doc(docPath)
    await ref.update({ ...updates, processedAt: new Date().toISOString() })
    const snap = await ref.get()
    return { id: snap.id, _path: docPath, ...snap.data() }
  } catch (err) {
    console.warn('Firestore unavailable for comment update', err.message)
    return { _path: docPath, ...updates }
  }
}

export async function getCommentByPath(docPath) {
  try {
    const snap = await db.doc(docPath).get()
    return snap.exists ? { id: snap.id, _path: docPath, ...snap.data() } : null
  } catch (err) {
    console.warn('Firestore unavailable for comment read', err.message)
    return null
  }
}
