'use client';

import { useState } from 'react';
import type { Prompt } from '../../lib/queries';

interface Props {
  initialPrompts: Prompt[];
}

export function PromptManager({ initialPrompts }: Props) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = async () => {
    const response = await fetch('/admin/api/prompts');
    if (response.ok) {
      const data = await response.json();
      setPrompts(data.prompts);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    const response = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, body, notes: notes || null })
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error ?? 'Kunne ikke opprette.');
    } else {
      setFeedback('Ny prompt lagret.');
      setName('');
      setBody('');
      setNotes('');
      await refresh();
    }

    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    setLoading(true);
    setFeedback(null);
    const response = await fetch('/api/admin/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active })
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error ?? 'Kunne ikke oppdatere.');
    } else {
      await refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6" onSubmit={handleCreate}>
        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="prompt-name">
            Navn
          </label>
          <input
            id="prompt-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Morgenbrief v1"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="prompt-body">
            Prompt
          </label>
          <textarea
            id="prompt-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Systeminstruksjon..."
            required
            rows={8}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="prompt-notes">
            Notater (valgfritt)
          </label>
          <textarea
            id="prompt-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110 disabled:opacity-60"
          disabled={loading}
        >
          Lagre ny prompt
        </button>
        {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
      </form>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <article key={prompt.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{prompt.name}</h3>
                <p className="text-xs text-slate-500">Versjon {prompt.version}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    prompt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {prompt.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
                {!prompt.is_active && (
                  <button
                    onClick={() => toggleActive(prompt.id, true)}
                    className="rounded-lg border border-brand-accent px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-accent/10"
                    disabled={loading}
                  >
                    Aktiver
                  </button>
                )}
                {prompt.is_active && (
                  <button
                    onClick={() => toggleActive(prompt.id, false)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    disabled={loading}
                  >
                    Deaktiver
                  </button>
                )}
              </div>
            </header>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-900/90 p-4 text-sm text-slate-100">
              {prompt.body}
            </pre>
            {prompt.notes && <p className="mt-3 text-sm text-slate-500">{prompt.notes}</p>}
          </article>
        ))}
        {prompts.length === 0 && <p className="text-sm text-slate-500">Ingen promptversjoner er definert ennå.</p>}
      </div>
    </div>
  );
}
