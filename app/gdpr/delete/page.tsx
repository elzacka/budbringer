import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServiceClient } from '../../../lib/supabase-admin';
import { verifySignature, createSignature } from '../../../lib/unsubscribe';
import { GDPRDeleteForm } from '../../../components/GDPRDeleteForm';

export const metadata: Metadata = {
  title: 'Slett personopplysninger – Budbringer',
  description: 'Be om permanent sletting av alle dine personopplysninger i henhold til GDPR.'
};

// Force dynamic rendering for this page due to searchParams usage
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{
    email?: string;
    signature?: string;
    step?: string;
  }>;
}

export default async function GDPRDeletePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const email = resolvedSearchParams?.email;
  const signature = resolvedSearchParams?.signature;
  const step = resolvedSearchParams?.step || 'request';

  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Tjeneste ikke tilgjengelig
            </h1>
            <p className="text-gray-600">
              GDPR-sletting er ikke konfigurert. Kontakt administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm' && email && signature) {
    const normalizedEmail = email.trim().toLowerCase();

    // Verify signature
    if (!verifySignature(normalizedEmail, signature, secret)) {
      redirect('/gdpr/delete?error=invalid_signature');
    }

    // Check if subscriber exists
    const service = getSupabaseServiceClient();
    const { data: subscriber } = await service
      .from('subscribers')
      .select('email, created_at, status')
      .eq('email', normalizedEmail)
      .single();

    if (!subscriber) {
      return (
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Ingen data funnet
              </h1>
              <p className="text-gray-600">
                Vi fant ingen personopplysninger knyttet til e-postadressen{' '}
                <strong>{email}</strong>.
              </p>
              <div className="mt-6">
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Tilbake til forsiden
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              🗑️ Bekreft sletting av personopplysninger
            </h1>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Advarsel: Permanent sletting
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      Denne handlingen kan ikke angres. Vi vil permanent slette:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Din e-postadresse og alle tilknyttede data</li>
                      <li>Dine abonnementsinnstillinger og språkpreferanser</li>
                      <li>Historikk over sendte nyhetsbrev</li>
                      <li>Alle andre personopplysninger vi har lagret om deg</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Dine registrerte data
              </h2>
              <div className="bg-gray-50 rounded-md p-4">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">E-postadresse:</dt>
                    <dd className="text-sm text-gray-900">{subscriber.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status:</dt>
                    <dd className="text-sm text-gray-900">
                      {subscriber.status === 'confirmed' ? 'Aktiv abonnent' :
                       subscriber.status === 'unsubscribed' ? 'Avmeldt' :
                       subscriber.status === 'pending' ? 'Avventer bekreftelse' : subscriber.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registrert:</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(subscriber.created_at).toLocaleDateString('no-NO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <GDPRDeleteForm email={normalizedEmail} signature={signature} />

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Denne funksjonen er implementert i henhold til GDPR (Personvernforordningen)
                artikkel 17 - retten til sletting ("retten til å bli glemt").
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - request deletion by email
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔒 Slett personopplysninger (GDPR)
          </h1>

          <div className="prose prose-gray max-w-none mb-8">
            <p>
              I henhold til GDPR (Personvernforordningen) har du rett til å få
              slettet dine personopplysninger. Vi vil permanent slette all data
              knyttet til din e-postadresse fra våre systemer.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">Hva som slettes:</h2>
            <ul>
              <li>Din e-postadresse og abonnementsdata</li>
              <li>Språkpreferanser og innstillinger</li>
              <li>Historikk over sendte nyhetsbrev</li>
              <li>Eventuelle feilmeldinger som inneholder din e-postadresse</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">Slik fungerer det:</h2>
            <ol>
              <li>Skriv inn din e-postadresse nedenfor</li>
              <li>Vi sender deg en e-post med en sikker lenke</li>
              <li>Klikk på lenken for å bekrefte slettingen</li>
              <li>All data slettes permanent og kan ikke gjenopprettes</li>
            </ol>
          </div>

          <form method="GET" action="/api/gdpr/request-deletion" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-postadresse
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="din@epost.no"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
            >
              Send slettingsforespørsel
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Trenger du hjelp?</h3>
            <p className="text-sm text-gray-600">
              Hvis du har spørsmål om datasletting eller personvern, kan du kontakte oss på{' '}
              <a href="mailto:ikkesvar@tazk.no" className="text-blue-600 hover:text-blue-800">
                ikkesvar@tazk.no
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}