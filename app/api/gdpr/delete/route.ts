import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../../lib/supabase-admin';
import { verifySignature } from '../../../../lib/unsubscribe';

const schema = z.object({
  email: z.string().email(),
  signature: z.string().min(10),
  confirm: z.literal(true) // User must explicitly confirm deletion
});

export async function POST(request: Request) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Tjeneste ikke konfigurert' }, { status: 500 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 422 });
  }

  const { email, signature, confirm } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Verify signature to ensure request is legitimate
  if (!verifySignature(normalizedEmail, signature, secret)) {
    return NextResponse.json({ error: 'Signaturen er ugyldig' }, { status: 403 });
  }

  if (!confirm) {
    return NextResponse.json({ error: 'Sletting må bekreftes eksplisitt' }, { status: 400 });
  }

  const service = getSupabaseServiceClient();

  try {
    // Start transaction-like operations

    // 1. Get subscriber ID before deletion for cleanup
    const { data: subscriber, error: fetchError } = await service
      .from('subscribers')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No subscriber found
        return NextResponse.json({
          message: 'Ingen data funnet for denne e-postadressen'
        });
      }
      throw fetchError;
    }

    if (!subscriber) {
      return NextResponse.json({
        message: 'Ingen data funnet for denne e-postadressen'
      });
    }

    // 2. Anonymize error logs that might contain this email
    // First, get all error logs that contain this email
    const { data: errorLogs, error: fetchLogsError } = await service
      .from('error_logs')
      .select('id, error_message, context')
      .ilike('error_message', `%${normalizedEmail}%`);

    if (!fetchLogsError && errorLogs && errorLogs.length > 0) {
      // Update each log to replace the email with [REDACTED]
      for (const log of errorLogs) {
        const anonymizedMessage = log.error_message.replace(
          new RegExp(normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
          '[REDACTED]'
        );

        await service
          .from('error_logs')
          .update({
            error_message: anonymizedMessage,
            context: {
              ...((log.context as any) || {}),
              gdpr_anonymized: true,
              anonymized_at: new Date().toISOString()
            }
          })
          .eq('id', log.id);
      }
    }

    const errorLogError = fetchLogsError;

    if (errorLogError) {
      console.warn('Failed to anonymize error logs:', errorLogError);
      // Continue with deletion even if log anonymization fails
    }

    // 3. Delete the subscriber record completely
    const { error: deleteError } = await service
      .from('subscribers')
      .delete()
      .eq('id', subscriber.id);

    if (deleteError) {
      throw deleteError;
    }

    // 4. Log the deletion for audit purposes (without storing the email)
    const now = new Date().toISOString();
    await service
      .from('error_logs')
      .insert({
        error_type: 'gdpr_deletion',
        error_message: `GDPR deletion completed for subscriber ID: ${subscriber.id}`,
        phase: 'dispatch',
        context: {
          timestamp: now,
          subscriber_id: subscriber.id,
          note: 'Personal data permanently deleted per GDPR request'
        }
      });

    console.log(`GDPR deletion completed for subscriber ${subscriber.id} (email was ${normalizedEmail})`);

    return NextResponse.json({
      message: 'Alle personopplysninger er permanent slettet',
      deleted_at: now
    });

  } catch (error) {
    console.error('GDPR deletion error:', error);
    return NextResponse.json({
      error: 'Kunne ikke gjennomføre sletting'
    }, { status: 500 });
  }
}

// For debugging/testing - only works in development
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const service = getSupabaseServiceClient();

  // Check what data exists for this email
  const { data: subscriber } = await service
    .from('subscribers')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  const { data: errorLogs } = await service
    .from('error_logs')
    .select('id, error_message, context')
    .ilike('error_message', `%${normalizedEmail}%`);

  return NextResponse.json({
    subscriber: subscriber || null,
    error_logs: errorLogs || [],
    note: 'This is development-only data inspection'
  });
}