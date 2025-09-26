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
      return NextResponse.json({ error: 'Ugyldig forespørselsdata' }, { status: 422 });
    }

    const { subscriberId, action, reason } = parseResult.data;

    // Get subscriber details
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, email, status')
      .eq('id', subscriberId)
      .single();

    if (fetchError || !subscriber) {
      return NextResponse.json({ error: 'Abonnent ikke funnet' }, { status: 404 });
    }

    if (subscriber.status !== 'pending') {
      return NextResponse.json({ error: 'Abonnent venter ikke på godkjenning' }, { status: 400 });
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
      return NextResponse.json({ error: 'Kunne ikke oppdatere abonnent' }, { status: 500 });
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
      message: `Abonnent ${action === 'approve' ? 'godkjent' : 'avvist'}`,
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