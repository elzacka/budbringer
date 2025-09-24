import { getPrompts } from '../../../lib/queries';
import { PromptManager } from '../../../components/admin/PromptManager';

export const dynamic = 'force-dynamic';

export default async function PromptsPage() {
  const prompts = await getPrompts();

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Prompter</h1>
        <p className="text-sm text-slate-500">Definer hvordan agenten skal hente, tolke og presentere nyheter.</p>
      </div>
      <PromptManager initialPrompts={prompts || []} />
    </section>
  );
}
