'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
  source?: string;
}

interface PendingSubscribersProps {
  pendingSubscribers: Subscriber[];
}

export function PendingSubscribers({ pendingSubscribers }: PendingSubscribersProps) {
  const [subscribers, setSubscribers] = useState(pendingSubscribers);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  const handleAction = async (subscriberId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessing(subscriberId);
    setMessage('');

    try {
      const response = await fetch('/api/admin/subscribers/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriberId,
          action,
          reason: reason || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process request');
      }

      // Remove the subscriber from the list
      setSubscribers(prev => prev.filter(sub => sub.id !== subscriberId));
      setMessage(`Abonnent ${action === 'approve' ? 'godkjent' : 'avvist'} successfully`);

      // Refresh the page data to update counts
      router.refresh();
    } catch (error) {
      console.error('Error processing subscriber:', error);
      setMessage(`Feil: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = (subscriberId: string) => {
    handleAction(subscriberId, 'approve');
  };

  const handleReject = (subscriberId: string) => {
    const reason = prompt('Grunn for avvisning (valgfritt):');
    if (reason !== null) { // User didn't cancel
      handleAction(subscriberId, 'reject', reason);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-6 ${message.includes('Feil') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">E-post</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Registrert</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Kilde</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{subscriber.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(subscriber.created_at).toLocaleString('no-NO', { timeZone: 'Europe/Oslo' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {subscriber.source || 'ukjent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleApprove(subscriber.id)}
                        disabled={processing === subscriber.id}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === subscriber.id ? 'Prosesserer...' : 'Godkjenn'}
                      </button>
                      <button
                        onClick={() => handleReject(subscriber.id)}
                        disabled={processing === subscriber.id}
                        className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === subscriber.id ? 'Prosesserer...' : 'Avvis'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {subscribers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500">Alle forespørsler har blitt behandlet.</p>
        </div>
      )}
    </div>
  );
}