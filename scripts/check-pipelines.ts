import { getSupabaseServiceClient } from '../lib/supabase-admin';

async function checkPipelines() {
  const supabase = getSupabaseServiceClient();

  console.log('=== ALL PIPELINES ===');
  const { data: pipelines, error: pipelinesError } = await supabase
    .from('pipelines')
    .select('*')
    .order('id');

  if (pipelinesError) {
    console.error('Error fetching pipelines:', pipelinesError);
    return;
  }

  if (!pipelines || pipelines.length === 0) {
    console.log('⚠️  No pipelines found in database!');
  } else {
    pipelines.forEach(pipeline => {
      console.log(`📋 Pipeline ${pipeline.id}: "${pipeline.name}"`);
      if (pipeline.config) console.log(`   Config: ${JSON.stringify(pipeline.config, null, 2)}`);
      if (pipeline.template_config) console.log(`   Template: ${JSON.stringify(pipeline.template_config, null, 2)}`);
      console.log('');
    });
  }

  console.log('\n=== SEARCH FOR "KI-nyheter Norge" ===');
  const { data: targetPipeline, error: targetError } = await supabase
    .from('pipelines')
    .select('*')
    .eq('name', 'KI-nyheter Norge')
    .single();

  if (targetError) {
    console.log('❌ Pipeline "KI-nyheter Norge" NOT FOUND');
    console.log('   Error:', targetError.message);
  } else {
    console.log('✅ Found "KI-nyheter Norge" pipeline:');
    console.log(`   ID: ${targetPipeline.id}`);
    console.log(`   Name: ${targetPipeline.name}`);
  }

  console.log('\n=== SOURCE ASSIGNMENTS BY PIPELINE ===');
  const { data: assignments, error: assignError } = await supabase
    .from('pipeline_sources')
    .select(`
      pipeline_id,
      active,
      content_sources (name)
    `)
    .eq('active', true);

  if (assignError) {
    console.error('Error fetching assignments:', assignError);
  } else {
    const byPipeline = assignments?.reduce((acc, item) => {
      const pid = item.pipeline_id;
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push((item.content_sources as any).name);
      return acc;
    }, {} as Record<number, string[]>) || {};

    Object.entries(byPipeline).forEach(([pipelineId, sources]) => {
      console.log(`📌 Pipeline ${pipelineId}: ${sources.length} sources`);
      sources.forEach(name => console.log(`   - ${name}`));
      console.log('');
    });
  }
}

checkPipelines().catch(console.error);