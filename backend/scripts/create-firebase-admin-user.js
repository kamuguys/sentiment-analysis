import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const DEFAULT_EMAIL = process.env.NEW_ADMIN_EMAIL || 'admin@example.com'
const DEFAULT_PASSWORD = process.env.NEW_ADMIN_PASSWORD || 'Admin123!@'

async function loadServiceAccount(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    throw new Error(`Could not read service account file at ${filePath}: ${err.message}`, { cause: err })
  }
}

async function createAdmin() {
  try {
    // Load service account
    const serviceAccountPath = path.resolve(__dirname, '..', 'config', 'serviceAccountKey.json')
    const serviceAccount = await loadServiceAccount(serviceAccountPath)

    // Dynamic modular imports
    const adminApp = await import('firebase-admin/app')
    const adminFirestore = await import('firebase-admin/firestore')
    const { initializeApp, cert } = adminApp
    const { getFirestore, Timestamp } = adminFirestore

    // Initialize Firebase Admin SDK
    initializeApp({ credential: cert(serviceAccount) })
    const db = getFirestore()

    // Use createRequire to access firebase-admin auth
    const require = createRequire(import.meta.url)
    const adminRoot = require('firebase-admin')
    const auth = adminRoot.auth()

    // Check if user exists
    let userRecord = null
    try {
      userRecord = await auth.getUserByEmail(DEFAULT_EMAIL)
      console.log(`User already exists: ${userRecord.uid}`)
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.message?.includes('no user record')) {
        // Create user
        userRecord = await auth.createUser({
          email: DEFAULT_EMAIL,
          password: DEFAULT_PASSWORD,
          emailVerified: false,
          displayName: 'Platform Admin',
        })
        console.log(`Created user: ${userRecord.uid}`)
      } else {
        throw err
      }
    }

    const uid = userRecord.uid

    // Set custom claims for admin
    try {
      await auth.setCustomUserClaims(uid, { admin: true })
      console.log(`Set custom claims for ${uid}`)
    } catch (e) {
      console.warn('Failed to set custom claims:', e.message || e)
    }

    // Write into Firestore admins collection
    const payload = {
      uid,
      email: DEFAULT_EMAIL,
      enabled: true,
      role: 'admin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await db.collection('admins').doc(uid).set(payload, { merge: true })
    console.log(`Wrote admin mapping to admins/${uid}`)

    console.log('Admin creation complete.')
    console.log('Credentials:')
    console.log(`  email: ${DEFAULT_EMAIL}`)
    console.log(`  password: ${DEFAULT_PASSWORD}`)
    process.exit(0)
  } catch (err) {
    console.error('Failed to create admin:', err)
    process.exit(1)
  }
}

createAdmin()
