'use client';

import { useState } from 'react';
import type { Subscriber } from '../../lib/queries';

interface Props {
  initialRecipients: Subscriber[];
}

const statusLabels: Record<string, string> = {
  pending: 'Avventer bekreftelse',
  confirmed: 'Aktiv',
  unsubscribed: 'Avmeldt',
  rejected: 'Avvist'
};

export function RecipientManager({ initialRecipients }: Props) {
  const [recipients, setRecipients] = useState(initialRecipients);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = async () => {
    const response = await fetch('/admin/api/recipients');
    if (response.ok) {
      const data = await response.json();
      setRecipients(data.recipients);
    }
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    const response = await fetch('/api/admin/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error ?? 'Kunne ikke lagre.');
    } else {
      setFeedback('Lagt til!');
      setEmail('');
      await refresh();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setFeedback(null);

    const response = await fetch(`/api/admin/recipients?id=${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error ?? 'Kunne ikke slette.');
    } else {
      setFeedback('Slettet.');
      await refresh();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap items-end gap-3" onSubmit={handleAdd}>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500" htmlFor="new-recipient">
            Legg til ny mottaker
          </label>
          <input
            id="new-recipient"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="kollega@firma.no"
            className="min-w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110 disabled:opacity-60"
          disabled={loading}
        >
          Legg til
        </button>
      </form>
      {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">E-post</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sist sendt</th>
              <th className="px-4 py-3">Handling</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recipients.map((recipient) => (
              <tr key={recipient.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{recipient.email}</td>
                <td className="px-4 py-3 text-slate-600">{statusLabels[recipient.status] || recipient.status}</td>
                <td className="px-4 py-3 text-slate-500">
                  {recipient.last_sent_at ? new Date(recipient.last_sent_at).toLocaleString('no-NO', { timeZone: 'Europe/Oslo' }) : 'Aldri'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(recipient.id)}
                    className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                    disabled={loading}
                  >
                    Slett
                  </button>
                </td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                  Ingen mottakere registrert ennå.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
