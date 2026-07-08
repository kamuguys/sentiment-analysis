import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { admin, db } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const DEFAULT_ADMIN_CODE = process.env.ADMIN_CODE || 'admin123'
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'demo-admin-secret'

export function isAdminCodeValid(adminCode) {
  return typeof adminCode === 'string' && adminCode.trim().length > 0 && adminCode === DEFAULT_ADMIN_CODE
}

export function isAdminEmailAllowed(email) {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (!configured.length) {
    return true
  }

  return configured.includes((email || '').trim().toLowerCase())
}

export function generateAdminToken(adminCode = DEFAULT_ADMIN_CODE, businessId = '') {
  const payload = JSON.stringify({ adminCode, businessId, issuedAt: Date.now() })
  const encoded = Buffer.from(payload).toString('base64url')
  const signature = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex')
  return `${encoded}.${signature}`
}

export function verifyAdminToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return null
  }

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) {
    return null
  }

  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8')
    const expectedSignature = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('hex')

    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function verifyFirebaseAdminToken(token) {
  if (typeof token !== 'string' || !token) {
    return null
  }

  // Local development helper: allow a mock firebase token to simulate
  // a verified Firebase admin session when real Firebase credentials
  // are not available. Set MOCK_FIREBASE_ADMIN_TOKEN and
  // MOCK_FIREBASE_ADMIN_EMAIL in backend/.env to use this.
  if (process.env.MOCK_FIREBASE_ADMIN_TOKEN && token === process.env.MOCK_FIREBASE_ADMIN_TOKEN) {
    return {
      source: 'mock-firebase',
      uid: 'mock-admin',
      email: process.env.MOCK_FIREBASE_ADMIN_EMAIL || 'admin@local.test',
      businessId: process.env.MOCK_FIREBASE_ADMIN_BUSINESS_ID || '',
      claims: { admin: true },
    }
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    const email = decoded.email || ''
    const isAdminClaim = decoded.admin === true || decoded.role === 'admin' || decoded.isAdmin === true
    // If the token carries an admin claim, accept immediately
    if (isAdminClaim) {
      return {
        source: 'firebase',
        uid: decoded.uid,
        email,
        businessId: decoded.businessId || '',
        claims: decoded,
      }
    }

    // Check allow-list environment variable
    if (isAdminEmailAllowed(email)) {
      return {
        source: 'firebase',
        uid: decoded.uid,
        email,
        businessId: decoded.businessId || '',
        claims: decoded,
      }
    }

    // Fall back to Firestore admins collection: allow mapping of firebase UID or email
    try {
      // Try lookup by UID
      const docRef = db.collection(COLLECTIONS.ADMINS).doc(decoded.uid)
      const snap = await docRef.get()
      if (snap && snap.exists) {
        const data = snap.data()
        if (data && data.enabled !== false) {
          return {
            source: 'firebase-admin-doc',
            uid: decoded.uid,
            email,
            businessId: data.businessId || decoded.businessId || '',
            claims: decoded,
            adminDoc: data,
          }
        }
      }

      // Try lookup by email
      const q = await db.collection(COLLECTIONS.ADMINS).where('email', '==', email).limit(1).get()
      if (q && q.docs && q.docs.length) {
        const d = q.docs[0].data()
        if (d && d.enabled !== false) {
          return {
            source: 'firebase-admin-doc',
            uid: decoded.uid,
            email,
            businessId: d.businessId || decoded.businessId || '',
            claims: decoded,
            adminDoc: d,
          }
        }
      }
    } catch (e) {
      // Ignore firestore errors and treat as not authorized
    }

    return null
  } catch {
    return null
  }
}

export async function resolveAdminPayload(token) {
  if (!token) {
    return null
  }

  const firebasePayload = await verifyFirebaseAdminToken(token)
  if (firebasePayload) {
    return firebasePayload
  }

  return verifyAdminToken(token)
}

export function getAdminTokenFromRequest(req) {
  const header = req.get('authorization') || req.get('x-admin-token') || ''

  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim()
  }

  return header.trim()
}

export function adminAuthMiddleware(req, res, next) {
  const token = getAdminTokenFromRequest(req)

  Promise.resolve(resolveAdminPayload(token))
    .then((payload) => {
      if (!payload) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Please sign in again.' })
      }

      if (req.params.businessId && payload.businessId && payload.businessId !== req.params.businessId) {
        return res.status(403).json({ success: false, error: 'Forbidden for this business.' })
      }

      req.admin = payload
      return next()
    })
    .catch(() => res.status(401).json({ success: false, error: 'Unauthorized. Please sign in again.' }))
}
