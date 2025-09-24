'use client';

import { useState } from 'react';

export function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus('error');
      setMessage(payload.error ?? 'Kunne ikke fullføre registreringen. Prøv igjen senere.');
      return;
    }

    setStatus('success');
    setMessage(payload.message || 'Takk! Din forespørsel er mottatt og avventer godkjenning.');
    setEmail('');
  };

  return (
    <form
      className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_22px_50px_rgba(15,23,42,0.55)] backdrop-blur mx-auto"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="deg@eksempel.no"
          className="w-full rounded-lg border border-white/15 bg-slate-900/85 px-3 py-3 text-base text-slate-100 placeholder:text-slate-500 transition focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-sky-400 px-4 py-3 text-base font-semibold text-slate-950 transition-all duration-200 hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Lagrer...' : 'Meld meg på'}
        </button>
      </div>
      {status !== 'idle' && (
        <p
          className={`text-sm ${status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
