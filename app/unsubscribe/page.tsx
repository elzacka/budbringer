import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServiceClient } from '../../lib/supabase-admin';
import { verifySignature } from '../../lib/unsubscribe';

export const metadata: Metadata = {
  title: 'Avmelding – Budbringer'
};

// Force dynamic rendering for this page due to searchParams usage
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{
    email?: string;
    signature?: string;
  }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const email = resolvedSearchParams?.email;
  const signature = resolvedSearchParams?.signature;

  if (!email || !signature) {
    redirect('/');
  }

  // Verify signature and process unsubscribe automatically
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    redirect('https://forvarelset.tazk.no/page/meld-av/?error=configuration');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!verifySignature(normalizedEmail, signature, secret)) {
    redirect('https://forvarelset.tazk.no/page/meld-av/?error=invalid_signature');
  }

  // Process complete GDPR-compliant data deletion automatically
  try {
    const service = getSupabaseServiceClient();

    // 1. Get subscriber ID before deletion for cleanup
    const { data: subscriber, error: fetchError } = await service
      .from('subscribers')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No subscriber found - redirect as if successful
        redirect(`https://forvarelset.tazk.no/page/meld-av/?success=true&email=${encodeURIComponent(email)}`);
      }
      throw fetchError;
    }

    if (!subscriber) {
      // No subscriber found - redirect as if successful
      redirect(`https://forvarelset.tazk.no/page/meld-av/?success=true&email=${encodeURIComponent(email)}`);
    }

    // 2. Anonymize error logs that might contain this email
    const { data: errorLogs } = await service
      .from('error_logs')
      .select('id, error_message, context')
      .ilike('error_message', `%${normalizedEmail}%`);

    if (errorLogs && errorLogs.length > 0) {
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
              ...((log.context as Record<string, unknown>) || {}),
              gdpr_anonymized: true,
              anonymized_at: new Date().toISOString()
            }
          })
          .eq('id', log.id);
      }
    }

    // 3. Delete the subscriber record completely (GDPR compliance)
    const { error: deleteError } = await service
      .from('subscribers')
      .delete()
      .eq('id', subscriber.id);

    if (deleteError) {
      throw deleteError;
    }

    // 4. Log the deletion for audit purposes (without storing the email)
    await service
      .from('error_logs')
      .insert({
        error_type: 'unsubscribe_gdpr_deletion',
        error_message: `Automatic GDPR deletion completed for subscriber ID: ${subscriber.id} via unsubscribe`,
        phase: 'unsubscribe',
        context: {
          timestamp: new Date().toISOString(),
          subscriber_id: subscriber.id,
          note: 'Personal data permanently deleted per automatic unsubscribe flow'
        }
      });

    console.log(`Automatic GDPR deletion completed for subscriber ${subscriber.id} (email was ${normalizedEmail})`);

    // Successful unsubscribe with complete data deletion - redirect to confirmation
    redirect(`https://forvarelset.tazk.no/page/meld-av/?success=true&email=${encodeURIComponent(email)}&deleted=true`);
  } catch (error) {
    console.error('Unsubscribe/GDPR deletion error:', error);
    redirect('https://forvarelset.tazk.no/page/meld-av/?error=processing');
  }
}
