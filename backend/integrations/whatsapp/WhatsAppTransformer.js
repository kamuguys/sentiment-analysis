export function transformWhatsAppWebhookBody(body = {}) {
  const comments = []
  if (!body || !Array.isArray(body.entry)) return comments

  body.entry.forEach((entry) => {
    if (!entry.changes || !Array.isArray(entry.changes)) return

    entry.changes.forEach((change) => {
      const value = change.value || {}
      const messages = Array.isArray(value.messages) ? value.messages : []
      messages.forEach((message) => {
        const text = message.text?.body || message.body || ''
        if (!text || typeof text !== 'string') return

        comments.push({
          id: message.id,
          platform: 'whatsapp',
          externalId: message.id,
          externalPostId: message.context?.id || null,
          messageType: message.type || 'text',
          text,
          author: { id: message.from, name: null },
          created_time: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
          source: 'whatsapp',
        })
      })
    })
  })

  return comments
}
