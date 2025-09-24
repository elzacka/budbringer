import { getSupabaseServiceClient } from '@/lib/supabase-admin';
import { generateDigestWithAI } from './digestGenerator';
import { sendDigestEmail } from './mailer';

/**
 * Daglig kjøring for å generere og sende KI-nyhetsbrev
 */
export async function generateDailyDigest() {
  const supabase = getSupabaseServiceClient();

  // Starttidspunkt (Oslo-tid)
  const osloNowStart = new Date().toLocaleString('no-NO', {
    timeZone: 'Europe/Oslo',
  });
  console.log('Starter generering av daily digest:', osloNowStart);

  // Hent aktive mottakere
  const { data: recipients, error: recipientsError } = await supabase
    .from('recipients')
    .select('id, email')
    .eq('active', true);

  if (recipientsError) {
    console.error('Kunne ikke hente recipients:', recipientsError);
    throw recipientsError;
  }

  if (!recipients || recipients.length === 0) {
    console.log('Ingen aktive mottakere – hopper over utsendelse.');
    return;
  }

  // Hent aktiv prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('id, body')
    .eq('is_active', true)
    .single();

  if (promptError) {
    console.error('Kunne ikke hente aktiv prompt:', promptError);
    throw promptError;
  }

  if (!prompt) {
    console.log('Ingen aktiv prompt funnet – hopper over utsendelse.');
    return;
  }

  // Generer digest med KI-modellen
  const digestContent = await generateDigestWithAI(prompt.body);
  console.log('Generert digest basert på prompt:', prompt.id);

  // Send epost til alle mottakere
  for (const recipient of recipients) {
    try {
      await sendDigestEmail(recipient.email, digestContent);
      console.log(`Digest sendt til ${recipient.email}`);
    } catch (sendError) {
      console.error(`Feil ved sending til ${recipient.email}:`, sendError);
    }
  }

  // Sluttidspunkt (Oslo-tid)
  const osloNowEnd = new Date().toLocaleString('no-NO', {
    timeZone: 'Europe/Oslo',
  });
  console.log('Ferdig generert og sendt daily digest:', osloNowEnd);
}
