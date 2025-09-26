'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  email: string;
  signature: string;
}

export function GDPRDeleteForm({ email, signature }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDelete = async () => {
    if (!confirmed) {
      alert('Du må bekrefte at du ønsker å slette alle dine personopplysninger.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          signature,
          confirm: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Alle dine personopplysninger er slettet.'
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Noe gikk galt under slettingen.'
        });
      }
    } catch (error) {
      console.error('GDPR deletion error:', error);
      setResult({
        success: false,
        message: 'Kunne ikke kontakte serveren. Prøv igjen senere.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className={`rounded-md p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {result.success ? (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? 'Sletting fullført' : 'Sletting feilet'}
            </h3>
            <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              <p>{result.message}</p>
            </div>
            {result.success && (
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    href="/"
                    className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                  >
                    Gå til forsiden
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="confirm-deletion"
            name="confirm-deletion"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
            disabled={loading}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="confirm-deletion" className="font-medium text-gray-700">
            Jeg bekrefter at jeg ønsker å slette alle mine personopplysninger permanent
          </label>
          <p className="text-gray-500 mt-1">
            Denne handlingen kan ikke angres. All data knyttet til{' '}
            <strong>{email}</strong> vil bli slettet for godt.
          </p>
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={!confirmed || loading}
        className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sletter data...
          </span>
        ) : (
          '🗑️ Slett alle mine personopplysninger'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Ved å klikke denne knappen bekrefter du at du har forstått konsekvensene
        av permanent datasletting.
      </p>
    </div>
  );
}