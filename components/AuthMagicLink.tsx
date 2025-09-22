'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';

export function AuthMagicLink({ redirectTo }: { redirectTo?: string }) {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo ?? '/admin'}`,
        shouldCreateUser: false
      }
    });

    if (error) {
      setStatus('error');
      setMessage(error.message ?? 'Noe gikk galt.');
      return;
    }

    setStatus('sent');
    setMessage('Sjekk innboksen din – vi har sendt en påloggingslenke.');
  };

  return (
    <form
      className="mt-8 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white/90 p-8 shadow-xl"
      onSubmit={handleSubmit}
    >
      <label className="text-sm font-semibold text-slate-600" htmlFor="admin-email">
        E-post
      </label>
      <input
        id="admin-email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="deg@eksempel.no"
        required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-accent px-4 py-2 text-base font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Sender...' : 'Send magisk lenke'}
      </button>
      {status !== 'idle' && (
        <p className={`text-sm ${status === 'sent' ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p>
      )}
    </form>
  );
}
