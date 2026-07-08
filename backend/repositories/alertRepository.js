import { db } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

export async function createAlert(businessId, alert = {}) {
  if (!businessId || !alert.name) throw new Error('businessId and alert.name are required')

  try {
    const ref = db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('alerts').doc()
    const payload = {
      name: alert.name,
      description: alert.description || '',
      enabled: alert.enabled !== false,
      rule: alert.rule || {},
      recipients: alert.recipients || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await ref.set(payload)
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() }
  } catch (err) {
    console.warn('Firestore unavailable for alert create', err.message)
    return { id: `alert-${Date.now()}`, ...alert, enabled: alert.enabled !== false, rule: alert.rule || {}, recipients: alert.recipients || [] }
  }
}

export async function getAlertsByBusiness(businessId) {
  if (!businessId) throw new Error('businessId is required')

  try {
    const snapshot = await db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('alerts').get()
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('Firestore unavailable for alerts lookup', err.message)
    return []
  }
}

export async function updateAlert(businessId, alertId, updates = {}) {
  if (!businessId || !alertId) throw new Error('businessId and alertId are required')

  const ref = db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('alerts').doc(alertId)
  await ref.update({ ...updates, updatedAt: new Date().toISOString() })
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}

export async function deleteAlert(businessId, alertId) {
  if (!businessId || !alertId) throw new Error('businessId and alertId are required')

  const ref = db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('alerts').doc(alertId)
  await ref.delete()
  return { success: true }
}

export async function createAlertTrigger(businessId, alertId, trigger = {}) {
  if (!businessId || !alertId) throw new Error('businessId and alertId are required')

  const ref = db.collection(COLLECTIONS.BUSINESSES).doc(businessId).collection('alerts').doc(alertId).collection('triggers').doc()
  const payload = {
    ...trigger,
    triggeredAt: new Date().toISOString(),
  }

  await ref.set(payload)
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}

export async function getAlertTriggers(businessId, alertId, limit = 100) {
  if (!businessId || !alertId) throw new Error('businessId and alertId are required')

  const snapshot = await db
    .collection(COLLECTIONS.BUSINESSES)
    .doc(businessId)
    .collection('alerts')
    .doc(alertId)
    .collection('triggers')
    .orderBy('triggeredAt', 'desc')
    .limit(limit)
    .get()
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}
