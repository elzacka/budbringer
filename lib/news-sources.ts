export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api';
  language: 'nb' | 'en';
  topics?: string[];
}

export const defaultSources: NewsSource[] = [
  {
    id: 'nrk-beta',
    name: 'NRK Beta',
    url: 'https://www.nrk.no/teknologi/toppsaker.rss',
    type: 'rss',
    language: 'nb',
    topics: ['KI', 'Kunstig intelligens', 'OpenAI', 'Anthropic', 'Gemini',]
  },
  {
    id: 'tu',
    name: 'Teknisk Ukeblad',
    url: 'https://www.tu.no/rss/teknologi',
    type: 'rss',
    language: 'nb',
    topics: ['teknologi']
  },
  {
    id: 'anthropic-news',
    name: 'Anthropic',
    url: 'https://www.anthropic.com/news',
    type: 'rss',
    language: 'en',
    topics: ['produkt']
  },
  {
    id: 'openai-blog',
    name: 'OpenAI Nyheter',
    url: 'https://openai.com/nb-NO/news',
    type: 'rss',
    language: 'en',
    topics: ['produkt']
  }
];
