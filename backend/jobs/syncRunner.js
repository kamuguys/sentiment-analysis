#!/usr/bin/env node
import { syncAndEnqueueComments } from '../services/syncService.js'
import fs from 'fs'

// Usage: node jobs/syncRunner.js ./sample-comments.json BUSINESS_ID ACCOUNT_ID
const args = process.argv.slice(2)
if (args.length < 3) {
  console.error('Usage: node jobs/syncRunner.js <comments.json> <businessId> <accountId>')
  process.exit(2)
}

const [file, businessId, accountId] = args
let raw = null
try {
  raw = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch (err) {
  console.error('failed to read comments file', err)
  process.exit(1)
}

;(async () => {
  try {
    const r = await syncAndEnqueueComments(businessId, accountId, raw)
    console.log('sync result', r)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
