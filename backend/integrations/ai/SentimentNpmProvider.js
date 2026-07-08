import Sentiment from 'sentiment'

export default class SentimentNpmProvider {
  constructor() {
    this.client = new Sentiment()
    this.name = 'sentiment-npm'
  }

  async analyzeComment(text) {
    const analysis = this.client.analyze(text || '')
    const score = analysis.score || 0
    const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    return {
      sentiment: label,
      score,
      comparative: analysis.comparative || 0,
      confidence: Math.min(0.99, Math.abs(score) / 5),
      modelUsed: this.name,
    }
  }

  // placeholder for aspect extraction (no-op by default)
  async analyzeAspects(text) {
    return []
  }
}
