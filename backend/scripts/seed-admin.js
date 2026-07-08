import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '..', 'data')
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json')

async function seed() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  const admin = {
    uid: 'mock-admin',
    email: process.env.MOCK_FIREBASE_ADMIN_EMAIL || 'admin@local.test',
    businessId: process.env.MOCK_FIREBASE_ADMIN_BUSINESS_ID || 'business-1',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const payload = {
    [admin.uid]: admin,
  }

  await fs.writeFile(ADMINS_FILE, JSON.stringify(payload, null, 2), 'utf-8')
  console.log(`Wrote mock admin mapping to ${ADMINS_FILE}`)
}

seed().catch((err) => {
  console.error('Failed to seed admin', err)
  process.exit(1)
})
