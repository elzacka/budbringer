import Link from 'next/link';
import { getRecipients, getPrompts, getLatestRuns } from '../../lib/queries';

export default async function AdminOverviewPage() {
  const [recipients, prompts, runs] = await Promise.all([
    getRecipients(),
    getPrompts(),
    getLatestRuns(5)
  ]);

  const activePrompt = prompts.find((prompt) => prompt.is_active);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Aktive mottakere</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {recipients.filter((recipient) => recipient.status === 'confirmed').length}
          </p>
          <p className="mt-2 text-xs text-slate-500">Totalt {recipients.length} registrerte</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Aktiv prompt</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{activePrompt?.name ?? 'Ingen aktiv'}</p>
          <p className="mt-1 text-xs text-slate-500">Versjon {activePrompt?.version ?? '–'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Siste kjøring</p>
          {runs.length > 0 ? (
            <div className="mt-2 text-sm text-slate-600">
              <p>Status: <span className="font-semibold">{runs[0].status}</span></p>
              <p>Dato: {new Date(runs[0].created_at).toLocaleString('no-NO')}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Ingen kjøringer ennå.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Siste kjøringer</h2>
            <p className="text-sm text-slate-500">Monitorer nattlige jobber og håndter feil.</p>
          </div>
          <Link className="text-sm font-medium text-brand" href="/admin/runs">
            Se alle
          </Link>
        </header>
        <div className="mt-6 space-y-4">
          {runs.map((run) => (
            <article
              key={run.id}
              className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-semibold text-slate-800">{new Date(run.created_at).toLocaleString('no-NO')}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    run.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : run.status === 'pending'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Modell: {run.model_used ?? '–'} | Prompt: {run.prompt_id ?? '–'}</p>
              {run.error && <p className="mt-2 text-sm text-rose-600">{run.error}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
