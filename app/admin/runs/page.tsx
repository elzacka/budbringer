import Link from 'next/link';
import { getLatestRuns, type DigestRun } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const runs = await getLatestRuns(25);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Kjøringer</h1>
        <p className="text-sm text-slate-500">Operasjonell logg over nattlige jobber.</p>
      </header>
      <div className="space-y-6">
        {runs?.map((run: DigestRun) => (
          <article key={run.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(run.created_at).toLocaleString('no-NO')}
                </p>
                <p className="text-xs text-slate-500">Model: {run.model_used ?? '–'} | Prompt: {run.prompt_id ?? '–'}</p>
              </div>
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
        {(!runs || runs.length === 0) && <p className="text-sm text-slate-500">Ingen kjøringer registrert ennå.</p>}
      </div>
    </section>
  );
}
