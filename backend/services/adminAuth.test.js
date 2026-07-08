import test from 'node:test'
import assert from 'node:assert/strict'
import { generateAdminToken, isAdminEmailAllowed, verifyAdminToken } from './adminAuth.js'

test('generateAdminToken and verifyAdminToken round-trip for a business', () => {
  const token = generateAdminToken('admin123', 'business-1')
  const payload = verifyAdminToken(token)

  assert.equal(payload?.adminCode, 'admin123')
  assert.equal(payload?.businessId, 'business-1')
})

test('verifyAdminToken rejects a tampered token', () => {
  const token = generateAdminToken('admin123', 'business-1')
  const tampered = `${token}x`
  assert.equal(verifyAdminToken(tampered), null)
})

test('isAdminEmailAllowed honors the configured allow-list', () => {
  process.env.ADMIN_EMAILS = 'admin@example.com'
  assert.equal(isAdminEmailAllowed('admin@example.com'), true)
  assert.equal(isAdminEmailAllowed('other@example.com'), false)
})
