export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api';
  language: 'nb' | 'en';
  topics?: string[];
}

export const defaultSources: NewsSource[] = [
  // Norske kilder med høy prioritet for KI-nyheter
  {
    id: 'nrk-viten',
    name: 'NRK Viten',
    url: 'https://www.nrk.no/viten/toppsaker.rss',
    type: 'rss',
    language: 'nb',
    topics: ['KI', 'kunstig intelligens', 'maskinlæring', 'OpenAI', 'ChatGPT', 'Claude', 'Anthropic', 'Google AI', 'Microsoft AI', 'Gemini', 'Copilot', 'roboter', 'automatisering']
  },
  {
    id: 'nrk-nyheter',
    name: 'NRK Nyheter',
    url: 'https://www.nrk.no/nyheter/siste.rss',
    type: 'rss',
    language: 'nb',
    topics: ['KI', 'kunstig intelligens', 'OpenAI', 'ChatGPT', 'Claude', 'Anthropic', 'Google AI', 'Microsoft AI']
  },
  {
    id: 'itavisen',
    name: 'ITavisen',
    url: 'https://itavisen.no/feed',
    type: 'rss',
    language: 'nb',
    topics: ['KI', 'kunstig intelligens', 'AI', 'maskinlæring', 'OpenAI', 'ChatGPT', 'Claude', 'Anthropic', 'Microsoft AI', 'Google AI', 'automatisering', 'roboter']
  },
  {
    id: 'tu-ai',
    name: 'Teknisk Ukeblad',
    url: 'https://www.tu.no/rss/teknologi',
    type: 'rss',
    language: 'nb',
    topics: ['KI', 'kunstig intelligens', 'AI', 'maskinlæring', 'automatisering', 'roboter', 'digitalisering']
  },
  // Internasjonale kilder med høy kvalitet
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    type: 'rss',
    language: 'en',
    topics: ['OpenAI', 'Google', 'Microsoft', 'Anthropic', 'breakthrough', 'funding', 'regulation', 'EU', 'Norway']
  },
  {
    id: 'mit-tech-review-ai',
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    type: 'rss',
    language: 'en',
    topics: ['research', 'breakthrough', 'ethics', 'policy', 'regulation', 'European']
  },
  {
    id: 'the-verge-ai',
    name: 'The Verge AI',
    url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    language: 'en',
    topics: ['OpenAI', 'ChatGPT', 'Claude', 'Anthropic', 'Google', 'Microsoft', 'regulation', 'EU', 'policy']
  },
  // Selskaps- og forskningsblogs
  {
    id: 'ai-news',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/ai/feed/',
    type: 'rss',
    language: 'en',
    topics: ['Claude', 'OpenAI', 'ChatGPT', 'Anthropic', 'funding', 'enterprise']
  },
  {
    id: 'openai-blog',
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    type: 'rss',
    language: 'en',
    topics: ['ChatGPT', 'GPT', 'research', 'safety', 'products']
  }
];
