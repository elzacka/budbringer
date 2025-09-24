import dotenv from 'dotenv';
import Parser from 'rss-parser';
import { defaultSources } from '../lib/news-sources';

dotenv.config({ path: '.env.local' });
dotenv.config();

const parser = new Parser({
  customFields: {
    item: ['content:encoded']
  }
});

async function testSource(source: any) {
  console.log(`\n🧪 Testing: ${source.name}`);
  console.log(`   URL: ${source.url}`);
  console.log(`   Language: ${source.language}`);

  try {
    const startTime = Date.now();
    const feed = await parser.parseURL(source.url);
    const duration = Date.now() - startTime;

    const recentItems = feed.items.slice(0, 5);

    console.log(`   ✅ Success: ${feed.items.length} total items (${duration}ms)`);
    console.log(`   📰 Feed title: "${feed.title}"`);

    if (recentItems.length > 0) {
      console.log(`   📋 Recent articles:`);
      recentItems.forEach((item, i) => {
        const title = item.title?.substring(0, 80) + (item.title && item.title.length > 80 ? '...' : '');
        const published = item.pubDate ? new Date(item.pubDate).toLocaleDateString('no-NO') : 'Unknown';
        console.log(`      ${i + 1}. "${title}" (${published})`);
      });
    }

    return { success: true, itemCount: feed.items.length, duration };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Testing Norwegian AI news sources...\n');

  const results = [];

  for (const source of defaultSources) {
    const result = await testSource(source);
    results.push({ source: source.name, ...result });

    // Be polite to servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Test Summary:');
  console.log('================');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful sources: ${successful.length}/${results.length}`);
  console.log(`❌ Failed sources: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed sources:');
    failed.forEach(result => {
      console.log(`   - ${result.source}: ${result.error}`);
    });
  }

  if (successful.length > 0) {
    const totalItems = successful.reduce((sum, r) => sum + (r.itemCount || 0), 0);
    const avgDuration = successful.reduce((sum, r) => sum + (r.duration || 0), 0) / successful.length;
    console.log(`\n📈 Performance:`);
    console.log(`   Total articles found: ${totalItems}`);
    console.log(`   Average response time: ${Math.round(avgDuration)}ms`);
  }

  if (failed.length === 0) {
    console.log('\n🎉 All sources are working perfectly!');
  } else if (failed.length > successful.length) {
    console.log('\n⚠️  Warning: More sources are failing than working. Review source URLs.');
  } else {
    console.log('\n✨ Most sources are working. Consider updating failed sources.');
  }
}

main().catch(console.error);