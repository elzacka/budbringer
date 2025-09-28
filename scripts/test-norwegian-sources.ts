import { fetchRSSFeed, filterRelevantNews } from '../lib/news-fetcher';

async function testNorwegianSources() {
  const norwegianSources = [
    {
      name: 'NRK Viten',
      url: 'https://www.nrk.no/viten/toppsaker.rss',
      keywords: ['kunstig intelligens', 'KI', 'AI', 'maskinlæring', 'OpenAI', 'ChatGPT', 'GPT', 'Anthropic', 'Claude', 'Gemini', 'Copilot', 'MetaAI', 'xAI', 'Grok', 'ElevenLabs', 'GoogleAI', 'roboter', 'automatisering', 'digitalisering']
    },
    {
      name: 'NRK Nyheter',
      url: 'https://www.nrk.no/nyheter/siste.rss',
      keywords: ['kunstig intelligens', 'KI', 'AI', 'maskinlæring', 'OpenAI', 'ChatGPT', 'GPT', 'Anthropic', 'Claude', 'Gemini', 'Copilot', 'MetaAI', 'xAI', 'Grok', 'ElevenLabs', 'GoogleAI']
    },
    {
      name: 'ITavisen',
      url: 'https://itavisen.no/feed',
      keywords: ['kunstig intelligens', 'KI', 'AI', 'maskinlæring', 'OpenAI', 'ChatGPT', 'GPT', 'Anthropic', 'Claude', 'Gemini', 'Copilot', 'MetaAI', 'xAI', 'Grok', 'ElevenLabs', 'GoogleAI', 'roboter', 'automatisering', 'digitalisering']
    }
  ];

  for (const source of norwegianSources) {
    console.log(`\n🔍 Testing ${source.name}`);
    console.log(`   URL: ${source.url}`);

    try {
      // Test raw RSS fetch
      console.log('   📡 Fetching RSS feed...');
      const rawItems = await fetchRSSFeed(source.url);
      console.log(`   ✅ Retrieved ${rawItems.length} raw articles`);

      if (rawItems.length > 0) {
        console.log(`   📄 Sample titles:`);
        rawItems.slice(0, 3).forEach((item, i) => {
          console.log(`      ${i+1}. "${item.title}"`);
        });
      }

      // Test keyword filtering
      console.log('   🔍 Applying keyword filter...');
      const filteredItems = await filterRelevantNews(rawItems, {
        filter_keywords: source.keywords,
        max_age_days: 7
      });
      console.log(`   ✅ After filtering: ${filteredItems.length} relevant articles`);

      if (filteredItems.length > 0) {
        console.log(`   📰 Relevant articles:`);
        filteredItems.forEach((item, i) => {
          console.log(`      ${i+1}. "${item.title}"`);
          console.log(`         Source: ${item.source}, Published: ${new Date(item.published_at).toLocaleDateString('no-NO')}`);
        });
      } else {
        console.log(`   ⚠️  No articles matched keywords: ${source.keywords.slice(0, 5).join(', ')}...`);
      }

    } catch (error) {
      console.error(`   ❌ Error with ${source.name}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log('If Norwegian sources show 0 relevant articles, the issue might be:');
  console.log('1. Keyword filtering is too strict');
  console.log('2. Norwegian sources rarely cover AI/KI topics');
  console.log('3. Recent articles don\'t match the keywords');
  console.log('4. RSS feed structure issues');
}

testNorwegianSources().catch(console.error);