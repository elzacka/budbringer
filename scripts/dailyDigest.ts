import dotenv from 'dotenv';
import { getSupabaseServiceClient } from '../lib/supabase-admin';
import { generateDigestWithAI } from './digestGenerator';
// Remove the mock mailer import - we'll use webhook dispatch instead
import { formatNorwegianDateTime } from '../lib/timezone';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Daglig kjøring for å generere og sende KI-nyhetsbrev
 */
export async function generateDailyDigest() {
  const supabase = getSupabaseServiceClient();

  // Starttidspunkt (Oslo-tid)
  const osloNowStart = formatNorwegianDateTime();
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

  // Trigger email dispatch via Cloudflare Worker webhook
  const dispatchUrl = process.env.DISPATCH_URL;
  const dispatchToken = process.env.DISPATCH_TOKEN;

  if (!dispatchUrl) {
    console.error('❌ DISPATCH_URL not configured - cannot send emails');
    console.log('📧 Generated digest content is stored in database but emails not sent');
    return;
  }

  if (!dispatchToken) {
    console.error('❌ DISPATCH_TOKEN not configured - cannot authenticate with worker');
    return;
  }

  try {
    console.log('🚀 Triggering email dispatch via Cloudflare Worker...');

    const response = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dispatchToken}`
      }
      // No body - Worker fetches latest digest from database directly
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Email dispatch completed successfully');
    console.log(`📊 Emails sent: ${result.sent || 'unknown'}`);
    console.log(`❌ Emails failed: ${result.failed || 0}`);

  } catch (dispatchError) {
    console.error('❌ Failed to dispatch emails via worker:', dispatchError);
    console.log('📧 Digest is generated and stored, but emails could not be sent');
    throw dispatchError;
  }

  // Sluttidspunkt (Oslo-tid)
  const osloNowEnd = formatNorwegianDateTime();
  console.log('Ferdig generert og sendt daily digest:', osloNowEnd);
}

// Execute the function if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDailyDigest().catch(console.error);
}
