import { getRecipients } from '../../../lib/queries';
import { PendingSubscribers } from '../../../components/admin/PendingSubscribers';

export const dynamic = 'force-dynamic';

export default async function PendingPage() {
  const recipients = await getRecipients();
  const pendingRecipients = recipients?.filter(recipient => recipient.status === 'pending') || [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ventende godkjenninger</h1>
        <p className="text-sm text-slate-500">
          Godkjenn eller avvis abonnenter som venter på godkjenning.
        </p>
      </div>

      {pendingRecipients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Ingen ventende forespørsler.</p>
        </div>
      ) : (
        <PendingSubscribers pendingSubscribers={pendingRecipients} />
      )}
    </section>
  );
}