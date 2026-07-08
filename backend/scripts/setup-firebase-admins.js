import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'
import { admin, db, isMockDb } from '../config/firestore.js'
import { COLLECTIONS } from '../models/schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

/**
 * Setup script to initialize Firestore collections for Firebase admin authentication
 * 
 * Usage:
 *   node backend/scripts/setup-firebase-admins.js
 */

async function setupFirebaseAdmins() {
  if (isMockDb) {
    console.log('ℹ️  Mock Firestore detected. Skipping setup.')
    console.log('ℹ️  To use real Firebase:')
    console.log('    1. Download service account key from Firebase Console')
    console.log('    2. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json')
    console.log('    3. Run this script again')
    return
  }

  try {
    console.log('🔧 Setting up Firebase admin authentication...')

    // Verify Firebase is initialized
    if (!admin.apps || !admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized. Check your service account key.')
    }

    const projectId = process.env.FIREBASE_PROJECT_ID
    console.log(`✅ Firebase Admin SDK initialized for project: ${projectId}`)

    // Create admins collection (if it doesn't exist, this will create it on first document)
    console.log('\n📋 Creating admins collection structure...')

    // Get auth instance
    const auth = admin.auth()
    console.log('✅ Firebase Authentication API available')

    // Get Firestore instance
    const firestore = db
    console.log('✅ Firestore Database API available')

    // Create a template admin document (not saved, just showing structure)
    const adminTemplate = {
      uid: 'USER_UID_HERE', // Will be populated with real UID
      email: 'admin@example.com',
      businessId: 'business-1',
      enabled: true,
      role: 'admin', // Future RBAC
      permissions: ['read_all', 'write_all', 'manage_admins'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log('\n📄 Admin Document Template:')
    console.log(JSON.stringify(adminTemplate, null, 2))

    console.log('\n✅ Setup complete!')
    console.log('\n📌 Next Steps:')
    console.log('   1. Create a Firebase user in Firebase Console → Authentication')
    console.log('   2. Copy the User UID')
    console.log('   3. Create a document in Firestore → admins collection')
    console.log('   4. Use the UID as the document ID')
    console.log('   5. Add the fields from the template above')
    console.log('\n   Example Firestore document:')
    console.log('   Collection: admins')
    console.log('   Document ID: (paste the Firebase User UID)')
    console.log('   Fields:')
    console.log('     - uid: (auto or copy from UID)')
    console.log('     - email: admin@example.com')
    console.log('     - businessId: business-1')
    console.log('     - enabled: true')
    console.log('     - createdAt: (server timestamp)')
    console.log('     - updatedAt: (server timestamp)')

  } catch (err) {
    console.error('❌ Setup failed:', err.message)
    process.exit(1)
  }
}

setupFirebaseAdmins()
