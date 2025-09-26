import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Direct test of the Cloudflare Worker to debug email issues
 */
async function testWorkerDirect() {
  const dispatchUrl = process.env.DISPATCH_URL;
  const dispatchToken = process.env.DISPATCH_TOKEN;

  if (!dispatchUrl || !dispatchToken) {
    console.error('❌ DISPATCH_URL or DISPATCH_TOKEN missing from .env.local');
    return;
  }

  console.log('🧪 Testing Cloudflare Worker directly...');
  console.log(`📡 URL: ${dispatchUrl}`);

  try {
    const response = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dispatchToken}`
      }
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Worker response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Worker error response:', errorText);
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testWorkerDirect().catch(console.error);
}