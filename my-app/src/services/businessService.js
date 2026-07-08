import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db, firebaseEnabled } from './firebase'
import {
  apiEnabled as metaApiEnabled,
  getBusinessList,
  createBusinessRecord,
  updateBusinessRecord,
  deleteBusinessRecord,
} from './webApi'

const DEMO_STORAGE_KEY = 'sme-businesses'
const BUSINESS_COLLECTION = 'businesses'

function readDemoBusinesses() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeDemoBusinesses(businesses) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(businesses))
}

function buildDemoSentimentTrend() {
  return {
    Weekly: [
      { name: 'Mon', positive: 68, negative: 16, neutral: 16 },
      { name: 'Tue', positive: 72, negative: 14, neutral: 14 },
      { name: 'Wed', positive: 70, negative: 17, neutral: 13 },
      { name: 'Thu', positive: 75, negative: 12, neutral: 13 },
      { name: 'Fri', positive: 73, negative: 15, neutral: 12 },
    ],
    Monthly: [
      { name: 'Week 1', positive: 70, negative: 15, neutral: 15 },
      { name: 'Week 2', positive: 72, negative: 14, neutral: 14 },
      { name: 'Week 3', positive: 74, negative: 13, neutral: 13 },
      { name: 'Week 4', positive: 71, negative: 16, neutral: 13 },
    ],
    Quarterly: [
      { name: 'Q1', positive: 69, negative: 17, neutral: 14 },
      { name: 'Q2', positive: 72, negative: 15, neutral: 13 },
      { name: 'Q3', positive: 74, negative: 13, neutral: 13 },
      { name: 'Q4', positive: 76, negative: 12, neutral: 12 },
    ],
  }
}

function buildDemoAnalytics(business) {
  const name = business.name || 'Business'
  return {
    comments: [
      { text: `${name} customers appreciate the core product quality.`, sentiment: 'positive', aspect: 'Product Quality', confidence: 0.88, lang: 'English' },
      { text: `${name} delivery timing is improving but still has occasional delays.`, sentiment: 'neutral', aspect: 'Delivery', confidence: 0.78, lang: 'English' },
      { text: `Some customers want better pricing options for ${name}.`, sentiment: 'negative', aspect: 'Pricing', confidence: 0.82, lang: 'English' },
    ],
    kpiTrend: [
      { name: '05 Jul', v: 68 },
      { name: '12 Jul', v: 75 },
      { name: '19 Jul', v: 72 },
      { name: '26 Jul', v: 78 },
      { name: '02 Aug', v: 80 },
    ],
    sentimentTrend: buildDemoSentimentTrend(),
    aspects: [
      { name: 'Product Quality', pos: 64, neg: 16, neu: 20 },
      { name: 'Pricing', pos: 52, neg: 25, neu: 23 },
      { name: 'Customer Service', pos: 60, neg: 18, neu: 22 },
      { name: 'Delivery', pos: 56, neg: 20, neu: 24 },
      { name: 'Other', pos: 48, neg: 26, neu: 26 },
    ],
    warnings: [
      { title: 'Delivery delay trend', detail: 'Delivery-related comments rose this week for the selected business.', severity: 'Medium' },
      { title: 'Pricing sensitivity', detail: 'Negative pricing feedback is increasing in the latest reviews.', severity: 'Low' },
    ],
    languages: [
      { name: 'English', value: 72 },
      { name: 'Bemba', value: 12 },
      { name: 'Nyanja', value: 10 },
      { name: 'Code-switching', value: 6 },
    ],
    modelMetrics: [
      { label: 'Accuracy', value: 0.84 },
      { label: 'Precision', value: 0.82 },
      { label: 'Recall', value: 0.8 },
      { label: 'F1 Score', value: 0.81 },
    ],
    modelComparison: [
      { model: 'AfriBERTa', score: 0.84 },
      { model: 'Naive Bayes', score: 0.71 },
      { model: 'SVM', score: 0.76 },
    ],
  }
}

function normalizeBusiness(business, ownerId) {
  const demoAnalytics = buildDemoAnalytics(business)

  return {
    id: business.id,
    name: business.name || 'Untitled business',
    industry: business.industry || 'Retail',
    description: business.description || '',
    logo: business.logo || '',
    ownerId: business.ownerId || ownerId,
    connectedPlatforms: business.connectedPlatforms || [],
    createdAt: business.createdAt || new Date().toISOString(),
    isDemo: !firebaseEnabled,
    comments: business.comments || demoAnalytics.comments,
    kpiTrend: business.kpiTrend || demoAnalytics.kpiTrend,
    sentimentTrend: business.sentimentTrend || demoAnalytics.sentimentTrend,
    aspects: business.aspects || demoAnalytics.aspects,
    warnings: business.warnings || demoAnalytics.warnings,
    languages: business.languages || demoAnalytics.languages,
    modelMetrics: business.modelMetrics || demoAnalytics.modelMetrics,
    modelComparison: business.modelComparison || demoAnalytics.modelComparison,
  }
}

export async function listBusinesses(ownerId) {
  if (metaApiEnabled) {
    const businesses = await getBusinessList(ownerId)
    return businesses.map((business) => normalizeBusiness(business, ownerId))
  }

  if (!firebaseEnabled) {
    const businesses = readDemoBusinesses().filter((business) => business.ownerId === ownerId)
    return businesses.map((business) => normalizeBusiness(business, ownerId))
  }

  const q = query(collection(db, BUSINESS_COLLECTION), where('ownerId', '==', ownerId))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((docSnap) => normalizeBusiness({ id: docSnap.id, ...docSnap.data() }, ownerId))
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
}

export async function createBusiness(ownerId, payload) {
  const business = {
    name: payload.name,
    industry: payload.industry,
    description: payload.description,
    logo: payload.logo || '',
    ownerId,
    connectedPlatforms: payload.connectedPlatforms || [],
    createdAt: new Date().toISOString(),
  }

  if (metaApiEnabled) {
    const record = await createBusinessRecord({ ownerId, ...business })
    return normalizeBusiness(record, ownerId)
  }

  if (!firebaseEnabled) {
    const businesses = readDemoBusinesses()
    const nextBusiness = { ...business, id: `demo-${Date.now()}`, ...buildDemoAnalytics(business) }
    writeDemoBusinesses([nextBusiness, ...businesses])
    return nextBusiness
  }

  const ref = await addDoc(collection(db, BUSINESS_COLLECTION), business)
  return { ...business, id: ref.id }
}

export async function updateBusiness(businessId, updates) {
  if (metaApiEnabled) {
    const record = await updateBusinessRecord(businessId, updates)
    return normalizeBusiness(record, record.ownerId || '')
  }

  if (!firebaseEnabled) {
    const businesses = readDemoBusinesses()
    const nextBusinesses = businesses.map((business) => (business.id === businessId ? { ...business, ...updates } : business))
    writeDemoBusinesses(nextBusinesses)
    return nextBusinesses.find((business) => business.id === businessId)
  }

  const ref = doc(db, BUSINESS_COLLECTION, businessId)
  await updateDoc(ref, updates)
  return { id: businessId, ...updates }
}

export async function deleteBusiness(businessId) {
  if (metaApiEnabled) {
    await deleteBusinessRecord(businessId)
    return true
  }

  if (!firebaseEnabled) {
    const businesses = readDemoBusinesses().filter((business) => business.id !== businessId)
    writeDemoBusinesses(businesses)
    return true
  }

  const ref = doc(db, BUSINESS_COLLECTION, businessId)
  await deleteDoc(ref)
  return true
}
