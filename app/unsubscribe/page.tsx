import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UnsubscribePanel } from '../../components/UnsubscribePanel';

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

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-24">
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Avslutt abonnement</h1>
        <UnsubscribePanel email={email} signature={signature} />
      </div>
    </section>
  );
}
