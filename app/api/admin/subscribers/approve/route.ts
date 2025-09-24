import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../../../lib/supabase-admin';

const approvalSchema = z.object({
  subscriberId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();
    const parseResult = approvalSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 422 });
    }

    const { subscriberId, action, reason } = parseResult.data;

    // Get subscriber details
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, email, status')
      .eq('id', subscriberId)
      .single();

    if (fetchError || !subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    if (subscriber.status !== 'pending') {
      return NextResponse.json({ error: 'Subscriber is not pending approval' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'confirmed' : 'rejected';

    // Update subscriber status
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(reason && { notes: reason })
      })
      .eq('id', subscriberId);

    if (updateError) {
      console.error('Error updating subscriber:', updateError);
      return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
    }

    // Log the approval action
    try {
      await supabase
        .from('admin_actions')
        .insert({
          action: `subscriber_${action}`,
          target_id: subscriberId,
          details: { email: subscriber.email, reason },
          created_at: new Date().toISOString()
        });
    } catch {
      // Log table might not exist, but don't fail the operation
    }

    return NextResponse.json({
      message: `Subscriber ${action}ed successfully`,
      subscriber: {
        id: subscriberId,
        email: subscriber.email,
        status: newStatus
      }
    });

  } catch (error) {
    console.error('Route handler error (POST subscriber approval):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}