import SentimentNpmProvider from './SentimentNpmProvider.js'

export function createAIService(providerName = process.env.AI_PROVIDER || 'sentiment-npm') {
  switch (providerName) {
    case 'sentiment-npm':
      return new SentimentNpmProvider()
    // future providers (stubs):
    // case 'huggingface': return new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY)
    // case 'openai': return new OpenAIProvider(process.env.OPENAI_API_KEY)
    default:
      return new SentimentNpmProvider()
  }
}
