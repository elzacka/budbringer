import { getSupabaseServiceClient } from '../lib/supabase-admin';

async function checkSources() {
  const supabase = getSupabaseServiceClient();

  console.log('=== ALL CONTENT SOURCES ===');
  const { data: allSources, error: sourcesError } = await supabase
    .from('content_sources')
    .select('*')
    .order('priority', { ascending: false });

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError);
    return;
  }

  allSources?.forEach(source => {
    console.log(`📰 ${source.name} (${source.type})`);
    console.log(`   URL: ${source.base_url}`);
    console.log(`   Priority: ${source.priority}, Active: ${source.active}`);
    console.log(`   Category: ${source.category}`);
    if (source.config) console.log(`   Config: ${JSON.stringify(source.config, null, 2)}`);
    console.log('');
  });

  console.log('\n=== PIPELINE SOURCES ===');
  const { data: pipelineSources, error: pipelineError } = await supabase
    .from('pipeline_sources')
    .select(`
      pipeline_id,
      priority,
      active,
      content_sources (
        id,
        name,
        type,
        base_url,
        category,
        priority,
        active
      )
    `)
    .eq('active', true)
    .order('priority', { ascending: false });

  if (pipelineError) {
    console.error('Error fetching pipeline sources:', pipelineError);
    return;
  }

  pipelineSources?.forEach(ps => {
    const source = ps.content_sources as any;
    console.log(`🔗 Pipeline ${ps.pipeline_id} → ${source.name}`);
    console.log(`   Priority: Pipeline(${ps.priority}) Source(${source.priority})`);
    console.log(`   URL: ${source.base_url}`);
    console.log('');
  });

  console.log('\n=== NORWEGIAN SOURCES ANALYSIS ===');
  const norwegianSources = allSources?.filter(source =>
    source.base_url.includes('.no') ||
    source.name.toLowerCase().includes('norsk') ||
    source.name.toLowerCase().includes('norwegian')
  );

  if (norwegianSources && norwegianSources.length > 0) {
    console.log('Norwegian sources found:');
    norwegianSources.forEach(source => {
      console.log(`   ${source.name} - Active: ${source.active}, Priority: ${source.priority}`);
    });
  } else {
    console.log('⚠️  No Norwegian sources found!');
  }

  console.log('\n=== PIPELINE 1 SOURCES ===');
  const pipeline1Sources = pipelineSources?.filter(ps => ps.pipeline_id === 1);
  console.log(`Pipeline 1 has ${pipeline1Sources?.length || 0} active sources`);
}

checkSources().catch(console.error);