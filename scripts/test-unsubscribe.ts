import { getSupabaseServiceClient } from '../lib/supabase-admin';
import { createSignature } from '../lib/unsubscribe';

async function testUnsubscribe() {
  const supabase = getSupabaseServiceClient();

  // Test email - you can replace this with your test email
  const testEmail = 'test@example.com';

  console.log(`🔍 Testing unsubscribe flow for: ${testEmail}`);

  // 1. Check if subscriber exists
  const { data: subscribers, error: fetchError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', testEmail);

  if (fetchError) {
    console.error('❌ Error fetching subscriber:', fetchError);
    return;
  }

  if (!subscribers || subscribers.length === 0) {
    console.log('ℹ️ Subscriber not found, creating test subscriber...');

    // Create test subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert([{
        email: testEmail,
        status: 'confirmed',
        language: 'no',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('❌ Error creating test subscriber:', insertError);
      return;
    }

    console.log('✅ Test subscriber created');
  }

  // 2. Check current status
  const { data: currentSubscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', testEmail)
    .single();

  console.log(`📊 Current status: ${currentSubscriber?.status}`);

  // 3. Generate unsubscribe signature
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    console.error('❌ UNSUBSCRIBE_SECRET not found in environment');
    return;
  }

  const signature = createSignature(testEmail, secret);
  console.log(`🔐 Generated signature: ${signature}`);

  // 4. Test unsubscribe API call
  const unsubscribeData = {
    email: testEmail,
    signature: signature
  };

  console.log('📤 Calling unsubscribe API...');

  const response = await fetch('http://localhost:3000/api/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(unsubscribeData)
  });

  const result = await response.json();
  console.log(`📨 API Response (${response.status}):`, result);

  // 5. Check updated status
  const { data: updatedSubscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', testEmail)
    .single();

  console.log(`📊 Updated status: ${updatedSubscriber?.status}`);

  if (updatedSubscriber?.status === 'unsubscribed') {
    console.log('✅ Unsubscribe test PASSED - status correctly updated to "unsubscribed"');
  } else {
    console.log('❌ Unsubscribe test FAILED - status was not updated correctly');
  }

  // 6. Generate test unsubscribe URL
  const baseUrl = process.env.PUBLIC_SITE_URL || 'https://budbringer.no';
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(testEmail)}&signature=${signature}`;
  console.log(`🔗 Test unsubscribe URL: ${unsubscribeUrl}`);
}

// Handle both direct execution and module import
if (require.main === module) {
  testUnsubscribe().catch(console.error);
}

export { testUnsubscribe };