import { getSupabaseServiceClient } from '@/lib/supabase-admin';

/**
 * Enkel test for å sjekke at kildene i databasen kan hentes
 */
async function testSources() {
  const supabase = getSupabaseServiceClient();

  try {
    const { data, error } = await supabase
      .from('sources')
      .select('id, url, active');

    if (error) {
      console.error('Feil ved henting av sources:', error.message || error);
      process.exit(1);
    }

    console.log('Fant sources:', data);
  } catch (error: any) {
    console.error('Uventet feil i testSources():', error.message || error);
    process.exit(1);
  }
}

// Kjør testen
testSources().catch((error: any) => {
  console.error('Unhandled error i main():', error.message || error);
  process.exit(1);
});
