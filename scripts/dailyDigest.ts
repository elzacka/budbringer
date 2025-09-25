import dotenv from 'dotenv';
import { getSupabaseServiceClient } from '../lib/supabase-admin';
import { generateDigestWithAI } from './digestGenerator';
import { sendDigestEmail } from './mailer';

// Load environment variables
dotenv.config({ path: '.env.local' });

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

  // Hent aktive mottakere (confirmed subscribers)
  const { data: recipients, error: recipientsError } = await supabase
    .from('subscribers')
    .select('id, email')
    .eq('status', 'confirmed');

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
  const { content: digestContent, runId } = await generateDigestWithAI(prompt.body, prompt.id);
  console.log('Generert digest basert på prompt:', prompt.id, 'Run ID:', runId);

  // Send epost til alle mottakere
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      await sendDigestEmail(recipient.email, digestContent);
      sentCount++;
      console.log(`✅ Digest sendt til ${recipient.email}`);
    } catch (sendError) {
      failedCount++;
      console.error(`❌ Feil ved sending til ${recipient.email}:`, sendError);
    }
  }

  console.log(`📊 Sammendrag: ${sentCount} sendt, ${failedCount} feilet av ${recipients.length} totalt`);

  // Sluttidspunkt (Oslo-tid)
  const osloNowEnd = new Date().toLocaleString('no-NO', {
    timeZone: 'Europe/Oslo',
  });
  console.log('Ferdig generert og sendt daily digest:', osloNowEnd);
}

// Execute the function if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDailyDigest().catch(console.error);
}
