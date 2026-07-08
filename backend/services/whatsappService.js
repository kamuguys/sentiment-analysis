import { syncAndEnqueueComments } from './syncService.js'
import { transformWhatsAppWebhookBody } from '../integrations/whatsapp/WhatsAppTransformer.js'

export function verifyWhatsAppWebhook(query) {
  const mode = query['hub.mode'] || query.mode
  const token = query['hub.verify_token'] || query.verify_token
  const challenge = query['hub.challenge'] || query.challenge

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return { valid: true, challenge: challenge || 'ok' }
  }
  return { valid: false }
}

export async function importWhatsAppWebhookEvents(businessId, accountId, body) {
  const comments = transformWhatsAppWebhookBody(body)
  if (!businessId || !accountId) {
    throw new Error('businessId and accountId are required to import WhatsApp events')
  }
  if (!comments.length) {
    return { inserted: 0, enqueued: 0 }
  }
  return syncAndEnqueueComments(businessId, accountId, comments)
}
