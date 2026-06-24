// Mock AfriBERTa service that simulates sentiment, aspect, and language detection

const LANGS = ['English', 'Bemba', 'Nyanja', 'code-switch']
const ASPECTS = ['Product Quality', 'Pricing', 'Customer Service', 'Delivery', 'Other']

export async function analyzeComment(text) {
  // deterministic-ish mock based on string
  const seed = text.length % 5
  const sentiment = ['positive', 'negative', 'neutral'][seed % 3]
  const aspect = ASPECTS[seed % ASPECTS.length]
  const lang = LANGS[seed % LANGS.length]
  const confidence = 0.7 + (seed % 3) * 0.1
  return { sentiment, aspect, lang, confidence }
}

export async function batchAnalyze(comments) {
  return Promise.all(comments.map(c => analyzeComment(c.text || c)))
}

export function getModelPerformance() {
  return {
    model: 'AfriBERTa-mock',
    accuracy: 0.86,
    precision: 0.84,
    recall: 0.82,
    f1: 0.83,
    inference_ms: 45
  }
}

export default { analyzeComment, batchAnalyze, getModelPerformance }
