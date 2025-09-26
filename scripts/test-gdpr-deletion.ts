import { getSupabaseServiceClient } from '../lib/supabase-admin';
import { createSignature } from '../lib/unsubscribe';

async function testGDPRDeletion() {
  const supabase = getSupabaseServiceClient();

  // Test email - you can replace this with your test email
  const testEmail = 'gdprtest@example.com';

  console.log(`🔍 Testing GDPR deletion flow for: ${testEmail}`);

  // 1. Create test data
  console.log('\n--- Setting up test data ---');

  // Create test subscriber
  const { error: insertError } = await supabase
    .from('subscribers')
    .upsert([{
      email: testEmail,
      status: 'confirmed',
      language: 'no',
      preferences: {
        frequency: 'daily',
        topics: ['ai', 'tech'],
        format: 'html'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }], {
      onConflict: 'email'
    });

  if (insertError) {
    console.error('❌ Error creating test subscriber:', insertError);
    return;
  }

  console.log('✅ Test subscriber created/updated');

  // Create test error logs containing the email
  await supabase
    .from('error_logs')
    .insert([
      {
        error_type: 'email_failure',
        error_message: `Failed to send email to ${testEmail}: Connection timeout`,
        phase: 'dispatch',
        context: {
          recipient: testEmail,
          attempt: 1,
          timestamp: new Date().toISOString()
        }
      },
      {
        error_type: 'validation_error',
        error_message: `Invalid email format detected: ${testEmail}`,
        phase: 'processing',
        context: {
          source: 'admin_form',
          validated_email: testEmail
        }
      }
    ]);

  console.log('✅ Test error logs created');

  // 2. Check current data
  console.log('\n--- Current data before deletion ---');

  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', testEmail)
    .single();

  console.log('📊 Subscriber:', {
    email: subscriber?.email,
    status: subscriber?.status,
    preferences: subscriber?.preferences
  });

  const { data: errorLogs } = await supabase
    .from('error_logs')
    .select('id, error_message, context')
    .ilike('error_message', `%${testEmail}%`);

  console.log(`📊 Error logs containing email: ${errorLogs?.length || 0}`);
  errorLogs?.forEach((log, index) => {
    console.log(`   ${index + 1}. ${log.error_message.substring(0, 80)}...`);
  });

  // 3. Generate signature and test deletion
  console.log('\n--- Testing GDPR deletion ---');

  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    console.error('❌ UNSUBSCRIBE_SECRET not found in environment');
    return;
  }

  const signature = createSignature(testEmail, secret);
  console.log(`🔐 Generated signature: ${signature.substring(0, 20)}...`);

  // Test the deletion API
  const deleteData = {
    email: testEmail,
    signature: signature,
    confirm: true
  };

  console.log('📤 Calling GDPR deletion API...');

  const response = await fetch('http://localhost:3000/api/gdpr/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(deleteData)
  });

  const result = await response.json();
  console.log(`📨 API Response (${response.status}):`, result);

  // 4. Verify deletion
  console.log('\n--- Verifying deletion ---');

  const { data: deletedSubscriber, error: fetchError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (fetchError && fetchError.code === 'PGRST116') {
    console.log('✅ Subscriber record deleted successfully');
  } else if (deletedSubscriber) {
    console.log('❌ Subscriber record still exists:', deletedSubscriber);
  } else {
    console.log('⚠️ Unexpected error checking subscriber:', fetchError);
  }

  // Check anonymized error logs
  const { data: remainingLogs } = await supabase
    .from('error_logs')
    .select('id, error_message, context')
    .ilike('error_message', `%${testEmail}%`);

  console.log(`📊 Error logs still containing email: ${remainingLogs?.length || 0}`);

  const { data: anonymizedLogs } = await supabase
    .from('error_logs')
    .select('id, error_message, context')
    .ilike('error_message', '%[REDACTED]%')
    .eq('context->>gdpr_anonymized', 'true');

  console.log(`📊 Anonymized error logs: ${anonymizedLogs?.length || 0}`);
  anonymizedLogs?.forEach((log, index) => {
    console.log(`   ${index + 1}. ${log.error_message.substring(0, 80)}...`);
  });

  // Check deletion audit log
  const { data: auditLogs } = await supabase
    .from('error_logs')
    .select('*')
    .eq('error_type', 'gdpr_deletion')
    .order('created_at', { ascending: false })
    .limit(1);

  if (auditLogs && auditLogs.length > 0) {
    console.log('✅ Deletion audit log created:', auditLogs[0].error_message);
  } else {
    console.log('⚠️ No deletion audit log found');
  }

  // 5. Test deletion URL generation
  console.log('\n--- Testing deletion URL generation ---');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const deletionUrl = `${baseUrl}/gdpr/delete?step=confirm&email=${encodeURIComponent(testEmail)}&signature=${signature}`;
  console.log(`🔗 GDPR deletion URL: ${deletionUrl}`);

  console.log('\n🎉 GDPR deletion test completed!');
}

// Handle both direct execution and module import
if (require.main === module) {
  testGDPRDeletion().catch(console.error);
}

export { testGDPRDeletion };