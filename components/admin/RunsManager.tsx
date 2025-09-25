'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DigestRunWithPrompt } from '../../lib/queries';

interface Props {
  initialRuns: DigestRunWithPrompt[];
}

export function RunsManager({ initialRuns }: Props) {
  const [runs, setRuns] = useState(initialRuns);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  const handleDelete = async (runId: string, status: string) => {
    if (status === 'success') {
      const confirmed = confirm('Er du sikker på at du vil slette denne vellykkede kjøringen?');
      if (!confirmed) return;
    }

    setDeletingId(runId);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/digest-runs?id=${runId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete run');
      }

      // Remove the run from the list
      setRuns(prev => prev.filter(run => run.id !== runId));
      setMessage('Kjøring slettet');
      router.refresh();
    } catch (error) {
      console.error('Error deleting run:', error);
      setMessage(`Feil: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-6 ${message.includes('Feil') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      {runs.map((run: DigestRunWithPrompt) => (
        <article key={run.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {new Date(run.created_at).toLocaleString('no-NO', { timeZone: 'Europe/Oslo' })}
              </p>
              <p className="text-xs text-slate-500">
                Model: {run.model_used ?? '–'} | Prompt: {run.prompts?.name ?? run.prompt_id ?? '–'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  run.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : run.status === 'pending'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {run.status}
              </span>
              <button
                onClick={() => handleDelete(run.id, run.status)}
                disabled={deletingId === run.id}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === run.id ? 'Sletter...' : 'Slett'}
              </button>
            </div>
          </div>
          {run.summary_plain && (
            <details className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <summary className="cursor-pointer font-semibold">Kortoppsummering</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{run.summary_plain}</pre>
            </details>
          )}
          {run.audio_url && (
            <p className="mt-3 text-sm text-slate-600">
              Lydversjon: <Link className="text-brand" href={run.audio_url} target="_blank">Hør</Link>
            </p>
          )}
          {run.error && (
            <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{run.error}</p>
          )}
        </article>
      ))}
      {runs.length === 0 && <p className="text-sm text-slate-500">Ingen kjøringer registrert ennå.</p>}
    </div>
  );
}