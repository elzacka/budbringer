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

  // Process the unsubscribe
  try {
    const service = getSupabaseServiceClient();
    await service
      .from('subscribers')
      .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    // Successful unsubscribe - redirect to your external page
    redirect(`https://forvarelset.tazk.no/page/meld-av/?success=true&email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    redirect('https://forvarelset.tazk.no/page/meld-av/?error=processing');
  }
}
