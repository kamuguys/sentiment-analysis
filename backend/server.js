import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Sentiment from 'sentiment'
import { db, isMockDb } from './config/firestore.js'
import { COLLECTIONS } from './models/schema.js'
import { adminAuthMiddleware, generateAdminToken, isAdminCodeValid, resolveAdminPayload } from './services/adminAuth.js'
import { verifyWhatsAppWebhook } from './services/whatsappService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 4000
const DATA_FILE = path.resolve(__dirname, 'data', 'businesses.json')
const LEGACY_DATA_FILE = path.resolve(__dirname, 'backend', 'data', 'businesses.json')
const META_APP_ID = process.env.META_APP_ID
const META_PAGE_ID = process.env.META_PAGE_ID
const META_INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.META_INSTAGRAM_BUSINESS_ACCOUNT_ID
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsapp-verify'

const sentiment = new Sentiment()

// In-memory admin store for mock Firestore mode
const inMemoryAdmins = new Map()

// Load persisted mock admins from disk when running in mock mode
const ADMINS_FILE = path.resolve(__dirname, 'data', 'admins.json')
;(async () => {
  if (isMockDb) {
    try {
      const raw = await fs.readFile(ADMINS_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([id, data]) => inMemoryAdmins.set(id, data))
        console.log(`Loaded ${inMemoryAdmins.size} mock admin(s) from ${ADMINS_FILE}`)
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn('Failed to load mock admins file', err.message)
      }
    }
  }
})()

function buildSentimentEntry(text, metadata = {}) {
  const analysis = sentiment.analyze(text)
  const score = analysis.score || 0
  const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'

  return {
    ...metadata,
    text,
    score,
    comparative: analysis.comparative || 0,
    sentiment: label,
  }
}

function buildFacebookAnalytics(posts) {
  const entries = []

  posts.forEach((post) => {
    if (typeof post.message === 'string' && post.message.trim().length > 0) {
      entries.push(
        buildSentimentEntry(post.message, {
          id: `${post.id}-post`,
          createdAt: post.created_time,
          permalink: post.permalink_url,
          source: 'post',
        }),
      )
    }

    if (Array.isArray(post.comments?.data)) {
      post.comments.data.forEach((comment) => {
        if (typeof comment.message === 'string' && comment.message.trim().length > 0) {
          entries.push(
            buildSentimentEntry(comment.message, {
              id: comment.id || `${post.id}-comment`,
              createdAt: comment.created_time,
              permalink: post.permalink_url,
              source: 'comment',
              author: comment.from?.name || null,
            }),
          )
        }
      })
    }
  })

  const counts = { positive: 0, negative: 0, neutral: 0 }
  entries.forEach((entry) => counts[entry.sentiment]++)
  const total = Math.max(1, entries.length)

  return {
    comments: entries,
    totals: {
      totalComments: entries.length,
      positive: Math.round((counts.positive / total) * 100),
      negative: Math.round((counts.negative / total) * 100),
      neutral: Math.round((counts.neutral / total) * 100),
    },
  }
}

app.use(cors())
app.use(express.json())

async function readBusinesses() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        const legacyRaw = await fs.readFile(LEGACY_DATA_FILE, 'utf-8')
        const parsed = JSON.parse(legacyRaw)
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
        await fs.writeFile(DATA_FILE, legacyRaw, 'utf-8')
        return parsed
      } catch (legacyError) {
        if (legacyError.code === 'ENOENT') {
          return []
        }
        throw legacyError
      }
    }
    throw error
  }
}

async function writeBusinesses(businesses) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(businesses, null, 2), 'utf-8')
}

app.get('/', (req, res) => {
  res.send({ message: 'SME backend is running.' })
})

// Lightweight health and Firestore connectivity check
app.get('/health', async (req, res) => {
  try {
    if (db) {
      return res.json({ status: 'ok', firestore: true })
    }
    return res.json({ status: 'ok', firestore: false })
  } catch (err) {
    console.error('health check error', err)
    return res.status(500).json({ status: 'error', error: String(err) })
  }
})

app.post('/admin/login', async (req, res) => {
  const { adminCode, businessId, idToken } = req.body || {}

  // Allow login without providing a businessId. Business selection is handled separately in the UI.
  if (idToken) {
    const payload = await resolveAdminPayload(idToken)
    if (!payload) {
      return res.status(401).json({ success: false, error: 'Invalid Firebase admin session' })
    }

    return res.json({
      success: true,
      token: idToken,
      provider: payload.source || 'firebase',
    })
  }

  if (!adminCode) {
    return res.status(400).json({ success: false, error: 'adminCode or idToken is required' })
  }

  if (!isAdminCodeValid(adminCode)) {
    return res.status(401).json({ success: false, error: 'Invalid admin code' })
  }

  return res.json({
    success: true,
    token: generateAdminToken(adminCode),
  })
})

// Admin management endpoints: create/update admin mapping in Firestore
app.post('/admin/users', adminAuthMiddleware, async (req, res) => {
  const { uid, email, businessId, enabled = true } = req.body || {}
  if (!uid && !email) return res.status(400).json({ success: false, error: 'uid or email is required' })

  try {
    const ref = uid ? db.collection(COLLECTIONS.ADMINS).doc(uid) : db.collection(COLLECTIONS.ADMINS).doc()
    const payload = { uid: uid || null, email: email || null, businessId: businessId || null, enabled: !!enabled, updatedAt: new Date().toISOString() }
    await ref.set(payload, { merge: true })
    // Persist to in-memory store in mock mode so subsequent reads work
    if (isMockDb && uid) {
      inMemoryAdmins.set(uid, payload)
      return res.json({ success: true, admin: { id: uid, ...payload } })
    }

    const snap = await ref.get()
    return res.json({ success: true, admin: { id: snap.id, ...snap.data() } })
  } catch (err) {
    console.error('create admin user error', err)
    return res.status(500).json({ success: false, error: 'Failed to create admin mapping' })
  }
})

app.get('/admin/users/:uid', adminAuthMiddleware, async (req, res) => {
  const { uid } = req.params
  try {
    if (isMockDb) {
      const data = inMemoryAdmins.get(uid) || null
      if (!data) return res.status(404).json({ success: false, error: 'Admin not found' })
      return res.json({ success: true, admin: { id: uid, ...data } })
    }

    const snap = await db.collection(COLLECTIONS.ADMINS).doc(uid).get()
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Admin not found' })
    return res.json({ success: true, admin: { id: snap.id, ...snap.data() } })
  } catch (err) {
    console.error('get admin user error', err)
    return res.status(500).json({ success: false, error: 'Failed to fetch admin mapping' })
  }
})

app.use('/admin/dashboard/:businessId', adminAuthMiddleware)
app.use('/admin/queue-status', adminAuthMiddleware)
app.use('/reports/:businessId', adminAuthMiddleware)

app.get('/businesses', async (req, res) => {
  const { ownerId } = req.query
  try {
    // If Firestore is configured, read from there
    if (db && process.env.USE_FIRESTORE === 'true') {
      const { getBusinessesByOwner } = await import('./repositories/businessRepository.js')
      const businesses = await getBusinessesByOwner(ownerId)
      return res.json(businesses)
    }

    const businesses = await readBusinesses()
    const filtered = ownerId ? businesses.filter((business) => business.ownerId === ownerId) : businesses
  // If Meta is configured, fetch recent page posts once and attach simple analytics to businesses that use Facebook
  try {
    if (META_PAGE_ID && META_ACCESS_TOKEN) {
      const url = `https://graph.facebook.com/v17.0/${META_PAGE_ID}/posts?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}&fields=id,message,created_time,comments,permalink_url&limit=10`
      const response = await fetch(url)
      const data = await response.json()
      if (response.ok && data && Array.isArray(data.data)) {
        const { comments, totals } = buildFacebookAnalytics(data.data)

        // Build simple aspect placeholders from sentiment breakdown
        const aspects = [
          { name: 'Product Quality', pos: Math.max(0, Math.round(totals.positive * 0.64)), neg: Math.max(0, Math.round(totals.negative * 0.16)), neu: Math.max(0, 100 - Math.round(totals.positive * 0.64) - Math.round(totals.negative * 0.16)) },
          { name: 'Pricing', pos: Math.max(0, Math.round(totals.positive * 0.52)), neg: Math.max(0, Math.round(totals.negative * 0.25)), neu: Math.max(0, 100 - Math.round(totals.positive * 0.52) - Math.round(totals.negative * 0.25)) },
          { name: 'Customer Service', pos: Math.max(0, Math.round(totals.positive * 0.60)), neg: Math.max(0, Math.round(totals.negative * 0.18)), neu: Math.max(0, 100 - Math.round(totals.positive * 0.60) - Math.round(totals.negative * 0.18)) },
          { name: 'Delivery', pos: Math.max(0, Math.round(totals.positive * 0.56)), neg: Math.max(0, Math.round(totals.negative * 0.20)), neu: Math.max(0, 100 - Math.round(totals.positive * 0.56) - Math.round(totals.negative * 0.20)) },
          { name: 'Other', pos: Math.max(0, Math.round(totals.positive * 0.48)), neg: Math.max(0, Math.round(totals.negative * 0.26)), neu: Math.max(0, 100 - Math.round(totals.positive * 0.48) - Math.round(totals.negative * 0.26)) },
        ]

        const sentimentTrend = {
          Weekly: comments.slice(0, 5).map((c, i) => ({ name: `Day ${i + 1}`, positive: totals.positive, negative: totals.negative, neutral: totals.neutral })),
          Monthly: comments.slice(0, 4).map((c, i) => ({ name: `Week ${i + 1}`, positive: totals.positive, negative: totals.negative, neutral: totals.neutral })),
          Quarterly: comments.slice(0, 4).map((c, i) => ({ name: `Q${i + 1}`, positive: totals.positive, negative: totals.negative, neutral: totals.neutral })),
        }

        const attached = filtered.map((b) => {
          if (Array.isArray(b.connectedPlatforms) && b.connectedPlatforms.includes('Facebook')) {
            return {
              ...b,
              comments,
              kpiTrend: [{ name: 'Live', v: totals.totalComments }],
              sentimentTrend,
              aspects,
              warnings: [],
              languages: [{ name: 'English', value: 72 }],
              modelMetrics: [{ label: 'Accuracy', value: 0.84 }],
              modelComparison: [{ model: 'AfriBERTa', score: 0.81 }],
              isDemo: false,
            }
          }
          return b
        })
        return res.json(attached)
      }
    }
  } catch (err) {
    console.error('businesses analytics error', err)
  }

    res.json(filtered)
  } catch (err) {
    console.error('error fetching businesses', err)
    res.status(500).json({ error: 'Failed to fetch businesses' })
  }
})

app.get('/businesses/:id', async (req, res) => {
  const businesses = await readBusinesses()
  const business = businesses.find((item) => item.id === req.params.id)
  if (!business) {
    return res.status(404).json({ error: 'Business not found' })
  }
  // If Meta is configured and business connects to Facebook, fetch recent posts and derive simple sentiment analytics
  try {
    let analytics = null
    if (META_PAGE_ID && META_ACCESS_TOKEN && Array.isArray(business.connectedPlatforms) && business.connectedPlatforms.includes('Facebook')) {
      const url = `https://graph.facebook.com/v17.0/${META_PAGE_ID}/posts?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}&fields=id,message,created_time,comments,permalink_url&limit=10`
      const response = await fetch(url)
      const data = await response.json()
      if (response.ok && data && Array.isArray(data.data)) {
        analytics = buildFacebookAnalytics(data.data)
      }
    }

    return res.json({ ...business, analytics })
  } catch (err) {
    console.error('analytics error', err)
    return res.json({ ...business })
  }
})

// Manual analysis trigger: analyze recent comments for a business
app.post('/analysis/run', async (req, res) => {
  const { businessId, limit } = req.body || {}
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const { analyzeRecentCommentsForBusiness } = await import('./services/analysisService.js')
    const results = await analyzeRecentCommentsForBusiness(businessId, { limit: limit || 50 })
    return res.json({ success: true, results })
  } catch (err) {
    console.error('analysis run error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

// Enqueue comment doc paths for analysis
app.post('/analysis/enqueue', async (req, res) => {
  const { businessId, commentPaths } = req.body || {}
  if (!businessId || !Array.isArray(commentPaths) || commentPaths.length === 0) {
    return res.status(400).json({ error: 'businessId and commentPaths[] are required' })
  }

  try {
    const { enqueueAnalysis } = await import('./repositories/analysisQueueRepository.js')
    const job = await enqueueAnalysis(businessId, commentPaths)
    return res.json({ success: true, job })
  } catch (err) {
    console.error('enqueue error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

// Import comments (dedupe + enqueue)
app.post('/sync/import', async (req, res) => {
  const { businessId, accountId, comments } = req.body || {}
  if (!businessId || !accountId || !Array.isArray(comments)) {
    return res.status(400).json({ error: 'businessId, accountId and comments[] are required' })
  }

  try {
    const { syncAndEnqueueComments } = await import('./services/syncService.js')
    const result = await syncAndEnqueueComments(businessId, accountId, comments)
    return res.json({ success: true, result })
  } catch (err) {
    console.error('sync import error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.post('/businesses', async (req, res) => {
  const business = req.body
  if (!business?.ownerId || !business?.name) {
    return res.status(400).json({ error: 'ownerId and name are required' })
  }

  const businesses = await readBusinesses()
  const nextBusiness = {
    ...business,
    id: `business-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }

  businesses.unshift(nextBusiness)
  await writeBusinesses(businesses)
  res.status(201).json(nextBusiness)
})

app.put('/businesses/:id', async (req, res) => {
  const businesses = await readBusinesses()
  const index = businesses.findIndex((item) => item.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Business not found' })
  }

  businesses[index] = {
    ...businesses[index],
    ...req.body,
    id: req.params.id,
  }

  await writeBusinesses(businesses)
  res.json(businesses[index])
})

app.delete('/businesses/:id', async (req, res) => {
  const businesses = await readBusinesses()
  const filtered = businesses.filter((item) => item.id !== req.params.id)
  if (filtered.length === businesses.length) {
    return res.status(404).json({ error: 'Business not found' })
  }

  await writeBusinesses(filtered)
  res.status(204).send()
})

app.get('/meta/page-posts', async (req, res) => {
  if (!META_PAGE_ID || !META_ACCESS_TOKEN) {
    return res.status(501).json({ error: 'Meta API is not configured' })
  }

  const url = `https://graph.facebook.com/v17.0/${META_PAGE_ID}/posts?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}&fields=id,message,created_time,comments,permalink_url&limit=10`
  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    return res.status(response.status).json(data)
  }

  res.json(data)
})

app.get('/meta/instagram-account', async (req, res) => {
  if (!META_INSTAGRAM_BUSINESS_ACCOUNT_ID || !META_ACCESS_TOKEN) {
    return res.status(501).json({ error: 'Meta API is not configured' })
  }

  const url = `https://graph.facebook.com/v17.0/${META_INSTAGRAM_BUSINESS_ACCOUNT_ID}?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}&fields=id,username,followers_count,media_count,profile_picture_url`
  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    return res.status(response.status).json(data)
  }

  res.json(data)
})

app.get('/whatsapp/webhook', (req, res) => {
  const { mode, verify_token, 'hub.mode': hubMode, 'hub.verify_token': hubToken, 'hub.challenge': hubChallenge } = req.query
  const query = { mode, verify_token, 'hub.mode': hubMode, 'hub.verify_token': hubToken, 'hub.challenge': hubChallenge }

  const { valid, challenge } = verifyWhatsAppWebhook(query)
  if (valid) {
    return res.send(challenge)
  }
  return res.status(403).send('Forbidden')
})

app.post('/whatsapp/webhook', async (req, res) => {
  const businessId = req.query.businessId || req.body.businessId
  const accountId = req.query.accountId || req.body.accountId
  if (!businessId || !accountId) {
    return res.status(400).json({ error: 'businessId and accountId are required' })
  }

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_VERIFY_TOKEN) {
    return res.status(501).json({ error: 'WhatsApp webhook is not configured' })
  }

  try {
    const { importWhatsAppWebhookEvents } = await import('./services/whatsappService.js')
    const result = await importWhatsAppWebhookEvents(businessId, accountId, req.body)
    return res.json({ success: true, result })
  } catch (err) {
    console.error('whatsapp webhook error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.get('/alerts/:businessId', async (req, res) => {
  const { businessId } = req.params
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const { getAlertsByBusiness } = await import('./repositories/alertRepository.js')
    const alerts = await getAlertsByBusiness(businessId)
    return res.json({ success: true, alerts })
  } catch (err) {
    console.error('get alerts error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.post('/alerts/:businessId', async (req, res) => {
  const { businessId } = req.params
  const alert = req.body || {}
  if (!businessId || !alert.name) {
    return res.status(400).json({ error: 'businessId and alert.name are required' })
  }

  try {
    const { createAlert } = await import('./repositories/alertRepository.js')
    const newAlert = await createAlert(businessId, alert)
    return res.status(201).json({ success: true, alert: newAlert })
  } catch (err) {
    console.error('create alert error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.post('/alerts/evaluate/:businessId', async (req, res) => {
  const { businessId } = req.params
  const { limit } = req.query || {}
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const { evaluateAlertsForBusiness } = await import('./services/alertService.js')
    const triggered = await evaluateAlertsForBusiness(businessId, { limit: limit ? Number(limit) : 100 })
    return res.json({ success: true, triggered, count: triggered.length })
  } catch (err) {
    console.error('evaluate alerts error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.post('/trends/compute/:businessId', async (req, res) => {
  const { businessId } = req.params
  const { period, limit } = req.query || {}
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const { computeTrends } = await import('./services/trendService.js')
    const trends = await computeTrends(businessId, period || 'daily', limit ? Number(limit) : 100)
    return res.json({ success: true, period: period || 'daily', trends, count: trends.length })
  } catch (err) {
    console.error('compute trends error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.get('/trends/:businessId', async (req, res) => {
  const { businessId } = req.params
  const { period, limit } = req.query || {}
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const { getTrendChart } = await import('./services/trendService.js')
    const chart = await getTrendChart(businessId, period || 'daily', limit ? Number(limit) : 30)
    return res.json({ success: true, period: period || 'daily', chart })
  } catch (err) {
    console.error('get trends error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.get('/reports/:businessId', async (req, res) => {
  const { businessId } = req.params
  const { format = 'json', startDate, endDate, period = 'daily' } = req.query || {}
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const { generateReport } = await import('./services/reportService.js')
    const options = {
      period,
      limit: 200,
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
    }

    const report = await generateReport(businessId, options)

    if (format === 'csv') {
      const { reportToCSV } = await import('./services/reportService.js')
      const csv = reportToCSV(report)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="report-${businessId}-${new Date().toISOString().split('T')[0]}.csv"`)
      return res.send(csv)
    }

    if (format === 'pdf') {
      const { reportToPDF } = await import('./integrations/reporting/PDFExporter.js')
      const pdf = reportToPDF(report)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="report-${businessId}-${new Date().toISOString().split('T')[0]}.pdf"`)
      return res.send(pdf)
    }

    return res.json({ success: true, report })
  } catch (err) {
    console.error('generate report error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.get('/admin/dashboard/:businessId', async (req, res) => {
  const { businessId } = req.params
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' })
  }

  try {
    const [alerts, trends, recentComments, queueStatus] = await Promise.all([
      (async () => {
        const { getAlertsByBusiness } = await import('./repositories/alertRepository.js')
        return getAlertsByBusiness(businessId)
      })(),
      (async () => {
        const { getTrendChart } = await import('./services/trendService.js')
        return getTrendChart(businessId, 'daily', 7)
      })(),
      (async () => {
        const { getCommentsByBusiness } = await import('./repositories/commentRepository.js')
        return getCommentsByBusiness(businessId, 10)
      })(),
      (async () => {
        const pending = await (async () => {
          try {
            const { getPendingAnalysis } = await import('./repositories/analysisQueueRepository.js')
            return getPendingAnalysis(1000)
          } catch {
            return []
          }
        })()
        return {
          pending: pending.length,
          processing: 0,
          completed: 0,
        }
      })(),
    ])

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 }
    recentComments.forEach((c) => {
      const label = c.sentiment?.label || 'neutral'
      sentimentCounts[label]++
    })

    return res.json({
      success: true,
      dashboard: {
        businessId,
        summary: {
          totalAlerts: alerts.length,
          enabledAlerts: alerts.filter((a) => a.enabled).length,
          recentComments: recentComments.length,
          sentimentBreakdown: sentimentCounts,
        },
        trends: trends.slice(0, 7),
        queueStatus,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('dashboard error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.get('/admin/queue-status', async (req, res) => {
  try {
    const { getPendingAnalysis } = await import('./repositories/analysisQueueRepository.js')
    const pending = await getPendingAnalysis(100)
    return res.json({
      success: true,
      queue: {
        pending: pending.length,
        processing: 0,
        completed: 0,
        lastPolled: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('queue status error', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`SME backend listening on http://localhost:${PORT}`)
})
