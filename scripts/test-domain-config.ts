import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Test domain configuration for email sending
 */
async function testDomainConfig() {
  console.log('🔍 Testing domain configuration for email sending...\n');

  const fromAddress = process.env.MAIL_FROM_ADDRESS;
  const replyTo = process.env.MAIL_REPLY_TO;
  const siteUrl = process.env.PUBLIC_SITE_URL;

  if (!fromAddress) {
    console.error('❌ MAIL_FROM_ADDRESS not found');
    return;
  }

  const domain = fromAddress.split('@')[1];
  console.log(`📧 From address: ${fromAddress}`);
  console.log(`📧 Reply-to: ${replyTo}`);
  console.log(`🌐 Domain: ${domain}`);
  console.log(`🔗 Public site URL: ${siteUrl}\n`);

  // Check DNS records that might be needed for email sending
  console.log('🔍 Checking DNS configuration...');

  try {
    // Check if domain resolves
    console.log(`📡 Testing domain resolution for ${domain}...`);
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`✅ Domain ${domain} is reachable (HTTP ${response.status})`);
  } catch (error) {
    console.log(`⚠️ Domain ${domain} may not be reachable:`, error instanceof Error ? error.message : error);
  }

  // Check public site URL
  if (siteUrl) {
    try {
      console.log(`📡 Testing public site URL: ${siteUrl}...`);
      const response = await fetch(siteUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      console.log(`✅ Public site URL is reachable (HTTP ${response.status})`);
    } catch (error) {
      console.log(`⚠️ Public site URL may not be reachable:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n💡 Common issues to check:');
  console.log('1. Resend domain verification - ensure tazk.no is verified');
  console.log('2. Resend API token validity');
  console.log('3. Rate limits or quota issues with Resend');
  console.log('4. Email content size or format issues');
  console.log('5. SPF/DKIM records for tazk.no domain');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDomainConfig().catch(console.error);
}