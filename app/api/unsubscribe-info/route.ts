import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../lib/supabase-admin';
import { verifySignature } from '../../../lib/unsubscribe';

const schema = z.object({
  email: z.string().email(),
  signature: z.string().min(10)
});

/**
 * API endpoint for external website to get unsubscribe confirmation and data info
 */
export async function POST(request: Request) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Unsubscribe service not configured' }, { status: 500 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 422 });
  }

  const { email, signature } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  if (!verifySignature(normalizedEmail, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  try {
    const service = getSupabaseServiceClient();

    // Check if user was actually subscribed
    const { data: subscriber, error } = await service
      .from('subscribers')
      .select('id, email, status, created_at, last_sent_at, source')
      .eq('email', normalizedEmail)
      .single();

    if (error || !subscriber) {
      return NextResponse.json({
        success: true,
        was_subscribed: false,
        message: 'Email address not found in our system'
      });
    }

    const wasSubscribed = subscriber.status === 'confirmed' || subscriber.status === 'unsubscribed';

    return NextResponse.json({
      success: true,
      was_subscribed: wasSubscribed,
      email: subscriber.email,
      subscription_info: {
        subscribed_since: subscriber.created_at,
        last_email_sent: subscriber.last_sent_at,
        subscription_source: subscriber.source,
        current_status: subscriber.status
      },
      data_storage_locations: [
        {
          system: 'Budbringer Database (Supabase)',
          purpose: 'Store email address and subscription status for newsletter delivery',
          data_types: ['Email address', 'Subscription status', 'Registration date', 'Last email sent date', 'Registration source'],
          status: subscriber.status === 'unsubscribed' ? 'Marked as unsubscribed - not deleted' : 'Active subscription'
        },
        {
          system: 'GitHub Actions Logs',
          purpose: 'Temporary storage during newsletter generation process',
          data_types: ['Email address during processing'],
          status: 'Automatically cleared after each newsletter generation'
        },
        {
          system: 'Cloudflare Workers',
          purpose: 'Email delivery processing',
          data_types: ['Email address during email sending'],
          status: 'No persistent storage - processed and cleared immediately'
        },
        {
          system: 'MailChannels (Email Service)',
          purpose: 'Email delivery service',
          data_types: ['Email address', 'Delivery status'],
          status: 'Subject to MailChannels retention policy (typically 30 days)'
        }
      ],
      privacy_notes: {
        gdpr_compliance: 'Data processing is based on consent (Article 6(1)(a) GDPR)',
        data_retention: 'Subscription data is retained until unsubscribe request. Unsubscribed emails are marked but not deleted for compliance and anti-spam purposes.',
        data_location: 'All data stored within EU (Supabase EU region)',
        rights: 'You have the right to access, rectify, or request deletion of your personal data'
      }
    });

  } catch (error) {
    console.error('Unsubscribe info error:', error);
    return NextResponse.json({ error: 'Failed to retrieve subscription information' }, { status: 500 });
  }
}