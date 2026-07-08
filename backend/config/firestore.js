import admin from 'firebase-admin'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const createMockDb = () => {
  const createQuery = () => ({
    where: () => createQuery(),
    orderBy: () => createQuery(),
    limit: () => createQuery(),
    get: async () => ({ docs: [], empty: true }),
  })

  const createDocumentRef = (path = 'mock') => ({
    path,
    set: async () => ({ path }),
    get: async () => ({ exists: false, id: path.split('/').pop(), data: () => null, ref: { path } }),
    update: async () => ({ path }),
    delete: async () => ({ path }),
    collection: () => createCollectionRef(`${path}/collection`),
    doc: () => createDocumentRef(`${path}/doc`),
  })

  const createCollectionRef = (path = 'mock') => ({
    path,
    doc: (id = 'mock') => createDocumentRef(`${path}/${id}`),
    where: () => createQuery(),
    orderBy: () => createQuery(),
    limit: () => createQuery(),
    get: async () => ({ docs: [], empty: true }),
    add: async () => ({ id: 'mock-id' }),
    collection: () => createCollectionRef(`${path}/collection`),
  })

  return {
    collection: (name) => createCollectionRef(name),
    doc: (path) => createDocumentRef(path),
    collectionGroup: () => createCollectionRef('collectionGroup'),
    batch: () => ({ set: () => {}, commit: async () => {} }),
  }
}

let db
const projectId = process.env.FIREBASE_PROJECT_ID
let googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS

// If GOOGLE_APPLICATION_CREDENTIALS is a relative path, resolve it from project root
if (googleApplicationCredentials && !googleApplicationCredentials.startsWith('/')) {
  googleApplicationCredentials = path.resolve(__dirname, '..', '..', googleApplicationCredentials)
}

// Check if the credentials file exists
const hasRealFirebaseConfig = Boolean(
  (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ||
  (googleApplicationCredentials && fs.existsSync(googleApplicationCredentials)) ||
  process.env.GCLOUD_PROJECT ||
  projectId
)

const isMockDb = !hasRealFirebaseConfig

if (!hasRealFirebaseConfig) {
  console.warn('No Firebase credentials detected; using mock Firestore for local/demo mode.')
  db = createMockDb()
} else {
  try {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          })
          console.log('✅ Firebase Admin SDK initialized with service account (env var)')
        } catch (parseErr) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseErr.message)
          admin.initializeApp({ projectId: projectId || 'demo-project' })
          console.log('⚠️  Firebase Admin SDK initialized with project ID only (development mode)')
        }
      } else if (googleApplicationCredentials && fs.existsSync(googleApplicationCredentials)) {
        // Load from file path
        const keyData = JSON.parse(fs.readFileSync(googleApplicationCredentials, 'utf-8'))
        admin.initializeApp({
          credential: admin.credential.cert(keyData),
        })
        console.log(`✅ Firebase Admin SDK initialized with service account key from ${googleApplicationCredentials}`)
      } else {
        // Development mode: use project ID only
        admin.initializeApp({ projectId: projectId || 'demo-project' })
        console.log('⚠️  Firebase Admin SDK initialized with project ID only (development mode)')
      }
    }

    db = admin.firestore()
  } catch (err) {
    console.warn('⚠️  Firestore unavailable, using mock DB for local/demo mode:', err.message)
    db = createMockDb()
  }
}

export { admin, db, isMockDb }
