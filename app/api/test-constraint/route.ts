import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '../../../lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Test if we can query the subscribers table
    const { data: subscribers, error: queryError } = await supabase
      .from('subscribers')
      .select('id, email, status')
      .limit(1);

    if (queryError) {
      return NextResponse.json({
        error: 'Query failed',
        details: queryError.message,
        code: queryError.code
      });
    }

    // If we have a subscriber, try to test the constraint
    if (subscribers && subscribers.length > 0) {
      const testSubscriber = subscribers[0];

      // Try to update with 'rejected' status
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({ status: 'rejected' })
        .eq('id', testSubscriber.id);

      if (updateError) {
        return NextResponse.json({
          constraint_test: 'failed',
          original_status: testSubscriber.status,
          error: updateError.message,
          code: updateError.code,
          hint: updateError.hint
        });
      }

      // Revert the change
      await supabase
        .from('subscribers')
        .update({ status: testSubscriber.status })
        .eq('id', testSubscriber.id);

      return NextResponse.json({
        constraint_test: 'passed',
        message: 'Successfully updated to rejected status and reverted'
      });
    }

    return NextResponse.json({
      message: 'No subscribers found to test with'
    });

  } catch (error) {
    console.error('Constraint test error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}