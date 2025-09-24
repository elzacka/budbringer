import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerComponentClient } from '../../../lib/supabase-server';
import { AuthMagicLink } from '../../../components/AuthMagicLink';

export const metadata: Metadata = {
  title: 'Logg inn – Budbringer'
};

// Force dynamic rendering for this page due to authentication
export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await getSupabaseServerComponentClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect(resolvedSearchParams?.redirectTo ?? '/admin');
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-slate-100 shadow-2xl">
        <h1 className="text-3xl font-semibold">Velkommen tilbake</h1>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          Logg inn med e-postadressen som er registrert som admin. Vi bruker passordløs innlogging og TOTP via Supabase.
        </p>
        <AuthMagicLink redirectTo={resolvedSearchParams?.redirectTo} />
      </div>
    </section>
  );
}
