import dotenv from 'dotenv';
import { getSupabaseServiceClient } from '../lib/supabase-admin';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function generateDigestWithAI(promptBody: string): Promise<{ content: any; runId: string }> {
  const supabase = getSupabaseServiceClient();

  console.log('Generating digest with AI using prompt:', promptBody.substring(0, 100) + '...');

  // Create a digest run record
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const { data: run, error: runError } = await supabase
    .from('digest_runs')
    .insert({
      executed_for: today,
      status: 'pending',
      model_used: 'manual-generation',
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (runError) {
    console.error('Failed to create digest run:', runError);
    throw runError;
  }

  try {
    // Generate mock digest content for now
    const digestContent = {
      dateLabel: new Date().toLocaleDateString('no-NO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      lead: 'Dagens KI-oppdateringer kuratert for deg.',
      sections: [
        {
          heading: 'Viktige nyheter',
          bullets: [
            'Test-generering av daglig digest fungerer',
            'Systemet er konfigurert og klar for automatisk kjøring',
            'Alle komponenter kommuniserer korrekt med databasen'
          ]
        },
        {
          heading: 'Tekniske oppdateringer',
          bullets: [
            'Digest-generering implementert',
            'Database-logging fungerer',
            'E-postmaler er klare for utsendelse'
          ]
        }
      ],
      actions: [
        'Sjekk at alle systemer fungerer som forventet',
        'Overvåk at abonnenter mottar e-postene'
      ]
    };

    // Update run status to success
    await supabase
      .from('digest_runs')
      .update({
        status: 'success',
        summary_plain: JSON.stringify(digestContent),
        updated_at: new Date().toISOString()
      })
      .eq('id', run.id);

    console.log(`Digest generated successfully with run ID: ${run.id}`);
    return { content: digestContent, runId: run.id };

  } catch (error) {
    // Update run status to failed
    await supabase
      .from('digest_runs')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', run.id);

    throw error;
  }
}