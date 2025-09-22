import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UnsubscribePanel } from '../../components/UnsubscribePanel';

export const metadata: Metadata = {
  title: 'Avmelding – Budbringer'
};

interface PageProps {
  searchParams?: {
    email?: string;
    signature?: string;
  };
}

export default function UnsubscribePage({ searchParams }: PageProps) {
  const email = searchParams?.email;
  const signature = searchParams?.signature;

  if (!email || !signature) {
    redirect('/');
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-24">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Avslutt abonnement</h1>
        <UnsubscribePanel email={email} signature={signature} />
      </div>
    </section>
  );
}
