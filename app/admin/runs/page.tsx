import { getLatestRuns } from '../../../lib/queries';
import { RunsManager } from '../../../components/admin/RunsManager';

export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const runs = await getLatestRuns(25);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Kjøringer</h1>
        <p className="text-sm text-slate-500">Operasjonell logg over nattlige jobber.</p>
      </header>
      <RunsManager initialRuns={runs || []} />
    </section>
  );
}
