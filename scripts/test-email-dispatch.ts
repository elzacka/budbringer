import dotenv from 'dotenv';
import { getSupabaseServiceClient } from '../lib/supabase-admin';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Test script to manually trigger email dispatch
 * Simulates what the Cloudflare Worker does
 */
async function testEmailDispatch() {
  const supabase = getSupabaseServiceClient();

  console.log('🔍 Testing email dispatch system...');

  try {
    // Get the latest successful digest run
    const { data: digests, error: digestError } = await supabase
      .from('digest_runs')
      .select('*')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1);

    if (digestError) {
      console.error('❌ Error fetching digests:', digestError);
      return;
    }

    if (!digests || digests.length === 0) {
      console.log('⚠️ No successful digest runs found. Run `npm run digest:generate` first.');
      return;
    }

    const digest = digests[0];
    console.log('✅ Found latest digest:', digest.id);
    console.log('📅 Created:', digest.created_at);
    console.log('📝 Has HTML content:', !!digest.summary_html);
    console.log('📝 Has plain text content:', !!digest.summary_plain);

    // Get confirmed subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('id, email, status')
      .eq('status', 'confirmed');

    if (subscribersError) {
      console.error('❌ Error fetching subscribers:', subscribersError);
      return;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('⚠️ No confirmed subscribers found.');
      return;
    }

    console.log(`👥 Found ${subscribers.length} confirmed subscribers`);

    // Check if we have the required environment variables for email dispatch
    const requiredVars = [
      'MAILCHANNELS_AUTH_TOKEN',
      'PUBLIC_SITE_URL',
      'UNSUBSCRIBE_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.log('⚠️ Missing environment variables for email dispatch:');
      missingVars.forEach(varName => console.log(`  - ${varName}`));
      console.log('\n📧 Email dispatch would be handled by Cloudflare Worker with these variables.');
    } else {
      console.log('✅ All required environment variables are configured');
    }

    // Check if DISPATCH_URL is configured
    if (process.env.DISPATCH_URL) {
      console.log('🔗 DISPATCH_URL configured:', process.env.DISPATCH_URL);
      console.log('🚀 Ready for automatic email dispatch via GitHub Actions');
    } else {
      console.log('⚠️ DISPATCH_URL not configured - GitHub Actions will skip email dispatch');
    }

    console.log('\n✅ Email dispatch system test completed');
    console.log('💡 To receive actual emails, ensure:');
    console.log('   1. Cloudflare Worker is deployed with email-dispatcher.js');
    console.log('   2. DISPATCH_URL points to your Cloudflare Worker');
    console.log('   3. All secrets are configured in GitHub and Cloudflare');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailDispatch().catch(console.error);
}