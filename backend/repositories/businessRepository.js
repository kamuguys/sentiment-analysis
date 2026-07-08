import { db } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

export async function getBusinessesByOwner(ownerId, limit = 50) {
  const q = db.collection(COLLECTIONS.BUSINESSES).where('ownerId', '==', ownerId).orderBy('createdAt', 'desc').limit(limit)
  const snapshot = await q.get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export async function getBusinessById(id) {
  const ref = db.collection(COLLECTIONS.BUSINESSES).doc(id)
  const snap = await ref.get()
  return snap.exists ? { id: snap.id, ...snap.data() } : null
}

export async function createBusiness(business) {
  const docRef = await db.collection(COLLECTIONS.BUSINESSES).add({
    ...business,
    createdAt: business.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  const snap = await docRef.get()
  return { id: docRef.id, ...snap.data() }
}

export async function updateBusiness(id, updates) {
  const ref = db.collection(COLLECTIONS.BUSINESSES).doc(id)
  await ref.update({ ...updates, updatedAt: new Date().toISOString() })
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}

export async function deleteBusiness(id) {
  await db.collection(COLLECTIONS.BUSINESSES).doc(id).delete()
  return true
}
