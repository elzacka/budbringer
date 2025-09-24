import { getRecipients } from '../../../lib/queries';
import { RecipientManager } from '../../../components/admin/RecipientManager';

export const dynamic = 'force-dynamic';

export default async function RecipientsPage() {
  const recipients = await getRecipients();

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mottakere</h1>
        <p className="text-sm text-slate-500">Legg til, fjern og hold oversikt over abonnenter.</p>
      </div>
      <RecipientManager initialRecipients={recipients || []} />
    </section>
  );
}
