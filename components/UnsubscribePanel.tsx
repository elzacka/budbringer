'use client';

import { useState } from 'react';

interface Props {
  email: string;
  signature: string;
}

export function UnsubscribePanel({ email, signature }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleClick = async () => {
    setStatus('loading');
    setMessage('');

    const response = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, signature })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus('error');
      setMessage(payload.error ?? 'Kunne ikke melde deg av.');
      return;
    }

    setStatus('done');
    setMessage('Du er nå meldt av. Du kan melde deg på igjen når som helst.');
  };

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100">
      <p className="text-sm text-slate-300">
        {status === 'done'
          ? 'Du vil ikke motta flere oppsummeringer. Takk for at du prøvde Budbringer!'
          : `Bekreft at du vil melde ${email} av Budbringers daglige oppsummering.`}
      </p>
      <button
        onClick={handleClick}
        disabled={status === 'loading' || status === 'done'}
        className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
      >
        {status === 'loading' ? 'Behandler…' : status === 'done' ? 'Avmeldt' : 'Meld meg av'}
      </button>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>
      )}
    </div>
  );
}
