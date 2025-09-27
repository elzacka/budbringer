import { getSupabaseServiceClient } from '../lib/supabase-admin';

async function debugUnsubscribe() {
  const email = 'hei@tazk.no';
  const normalizedEmail = email.trim().toLowerCase();

  console.log('🔍 Debugging unsubscribe process for:', normalizedEmail);

  const service = getSupabaseServiceClient();

  try {
    // Check if subscriber exists
    console.log('1. Checking if subscriber exists...');
    const { data: subscriber, error: fetchError } = await service
      .from('subscribers')
      .select('id, email, status')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching subscriber:', fetchError);
      return;
    }

    if (!subscriber) {
      console.log('ℹ️  No subscriber found with this email');
      return;
    }

    console.log('✅ Subscriber found:', subscriber);

    // Check if there are any RLS policies blocking deletion
    console.log('2. Testing deletion permissions...');
    const { error: deleteError } = await service
      .from('subscribers')
      .delete()
      .eq('id', subscriber.id);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      console.log('This might be an RLS policy issue or permission problem');
    } else {
      console.log('✅ Subscriber successfully deleted!');

      // Verify deletion
      const { data: checkDeleted } = await service
        .from('subscribers')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (checkDeleted) {
        console.log('❌ WARNING: Subscriber still exists after deletion!');
      } else {
        console.log('✅ Confirmed: Subscriber completely removed from database');
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugUnsubscribe();