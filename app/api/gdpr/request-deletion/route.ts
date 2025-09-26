import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../../lib/supabase-admin';
import { createSignature } from '../../../../lib/unsubscribe';

const schema = z.object({
  email: z.string().email()
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return NextResponse.redirect(new URL('/gdpr/delete?error=missing_email', request.url));
  }

  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/gdpr/delete?error=invalid_email', request.url));
  }

  const normalizedEmail = email.trim().toLowerCase();
  const secret = process.env.UNSUBSCRIBE_SECRET;

  if (!secret) {
    return NextResponse.redirect(new URL('/gdpr/delete?error=not_configured', request.url));
  }

  // Check if subscriber exists
  const service = getSupabaseServiceClient();
  const { data: subscriber, error } = await service
    .from('subscribers')
    .select('email, status')
    .eq('email', normalizedEmail)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking subscriber:', error);
    return NextResponse.redirect(new URL('/gdpr/delete?error=database_error', request.url));
  }

  if (!subscriber) {
    return NextResponse.redirect(new URL('/gdpr/delete?error=not_found', request.url));
  }

  // Generate secure signature
  const signature = createSignature(normalizedEmail, secret);

  // Create deletion confirmation URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const deletionUrl = `${baseUrl}/gdpr/delete?step=confirm&email=${encodeURIComponent(normalizedEmail)}&signature=${signature}`;

  // TODO: Send email with deletion link
  // For now, we'll redirect directly to the confirmation page
  // In production, you would send an email with the deletion link

  try {
    // Log the deletion request for audit purposes
    await service
      .from('error_logs')
      .insert({
        error_type: 'gdpr_deletion_request',
        error_message: `GDPR deletion requested for subscriber ${subscriber.email}`,
        phase: 'dispatch',
        context: {
          timestamp: new Date().toISOString(),
          email: normalizedEmail,
          status: subscriber.status,
          note: 'User requested data deletion via GDPR form'
        }
      });

    console.log(`GDPR deletion requested for: ${normalizedEmail}`);

    // For development/testing, redirect directly to confirmation
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.redirect(deletionUrl);
    }

    // In production, show success page instead of redirecting
    return NextResponse.redirect(new URL('/gdpr/delete?success=email_sent', request.url));

  } catch (auditError) {
    console.error('Failed to log deletion request:', auditError);
    // Continue with the process even if audit logging fails
    return NextResponse.redirect(deletionUrl);
  }
}

export async function POST(request: Request) {
  return GET(request);
}