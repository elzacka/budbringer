
create unique index if not exists pipelines_name_key on public.pipelines(name);
create unique index if not exists content_sources_name_key on public.content_sources(name);

DO
$$
DECLARE
  v_pipeline_id integer;
  v_source_id integer;
  v_source jsonb;
BEGIN
  INSERT INTO public.pipelines (name, purpose, config, template_config)
  VALUES (
    'KI-nyheter Norge',
    'ai-nyheter',
    jsonb_build_object(
      'ai_editor_prompt', 'Du er redaktør for et norsk KI-nyhetsbrev. Prioriter saker som er relevante for norske lesere, tech-miljøet og som kan påvirke Norge. Fokuser på praktiske anvendelser, forskningsnytt fra norske miljøer, regelverksendringer og teknologiutvikling som berører nordmenn.',
      'max_articles', 15,
      'require_approval', false,
      'filter_strength', 'high'
    ),
    jsonb_build_object(
      'language', 'no',
      'tone', 'profesjonell_tilgjengelig',
      'target_audience', 'norske brukere/lesere med ulik kompetanse og erfaring med KI og teknologi generelt',
      'style_guide', 'Bruk korrekt norsk, klarspråk, bevar engelske fagtermer og egennavn'
    )
  )
  ON CONFLICT (name) DO UPDATE
    SET purpose = EXCLUDED.purpose,
        config = EXCLUDED.config,
        template_config = EXCLUDED.template_config,
        updated_at = NOW()
  RETURNING id INTO v_pipeline_id;

  IF v_pipeline_id IS NULL THEN
    SELECT id INTO v_pipeline_id FROM public.pipelines WHERE name = 'KI-nyheter Norge';
  END IF;

  FOR v_source IN
    SELECT value
    FROM jsonb_array_elements('[{"name": "NRK Viten", "type": "rss", "base_url": "https://www.nrk.no/viten/toppsaker.rss", "config": {"filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "roboter", "automatisering", "digitalisering"], "language": "no", "quality": "high"}, "category": "norsk-media", "priority": 10, "processor_config": {"max_age_days": 3, "min_relevance": 0.6}}, {"name": "NRK Nyheter", "type": "rss", "base_url": "https://www.nrk.no/nyheter/siste.rss", "config": {"filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI"], "language": "no", "quality": "high"}, "category": "norsk-media", "priority": 9, "processor_config": {"max_age_days": 3, "min_relevance": 0.6}}, {"name": "Forskningsrådet", "type": "scraping", "base_url": "https://www.forskningsradet.no/forskningspolitikk-strategi/ltp/kunstig-intelligens/", "config": {"selector": "article", "title_selector": ["h1", "h2", "h3"], "date_selector": "time", "filter_keywords": ["KI", "forskning", "milliard"], "language": "no", "quality": "high"}, "category": "norsk-forskning", "priority": 10, "processor_config": {"max_age_days": 5, "min_relevance": 0.65}}, {"name": "Norwegian SciTech News", "type": "rss", "base_url": "https://norwegianscitechnews.com/feed", "config": {"filter_keywords": ["artificial intelligence", "AI", "machine learning", "robotics", "NTNU", "SINTEF"], "language": "en", "norwegian_relevance": true}, "category": "norsk-forskning", "priority": 8, "processor_config": {"max_age_days": 5, "min_relevance": 0.6}}, {"name": "AIavisen.no", "type": "scraping", "base_url": "https://aiavisen.no/ai-nyheter/", "config": {"selector": "article", "title_selector": ["h2", "h3"], "filter_keywords": ["Norge", "norsk", "skandinavisk"], "language": "no", "quality": "medium"}, "category": "spesialisert-ai", "priority": 7, "processor_config": {"max_age_days": 3, "min_relevance": 0.6}}, {"name": "Digi.no Generell", "type": "scraping", "base_url": "https://www.digi.no/", "config": {"selector": "article", "title_selector": ["h1", "h2"], "filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI"], "language": "no", "check_interval": "hourly"}, "category": "norsk-tech", "priority": 8, "processor_config": {"max_age_days": 2, "min_relevance": 0.6}}, {"name": "ITavisen", "type": "rss", "base_url": "https://itavisen.no/feed", "config": {"filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "roboter", "automatisering", "digitalisering"], "language": "no"}, "category": "norsk-tech", "priority": 7, "processor_config": {"max_age_days": 3, "min_relevance": 0.55}}, {"name": "TechCrunch AI", "type": "rss", "base_url": "https://techcrunch.com/category/artificial-intelligence/feed/", "config": {"filter_keywords": ["OpenAI", "Google", "Microsoft", "Anthropic", "breakthrough", "funding"], "language": "en", "quality": "high"}, "category": "internasjonal", "priority": 6, "processor_config": {"max_age_days": 2, "min_relevance": 0.55}}, {"name": "MIT Technology Review AI", "type": "rss", "base_url": "https://www.technologyreview.com/topic/artificial-intelligence/feed/", "config": {"filter_keywords": ["research", "breakthrough", "ethics", "policy"], "language": "en", "quality": "high"}, "category": "internasjonal", "priority": 6, "processor_config": {"max_age_days": 3, "min_relevance": 0.55}}, {"name": "The Verge AI", "type": "rss", "base_url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", "config": {"filter_keywords": ["OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "Microsoft", "Google", "regulation", "EU"], "language": "en", "quality": "high"}, "category": "internasjonal", "priority": 5, "processor_config": {"max_age_days": 3, "min_relevance": 0.55}}, {"name": "OpenAI Blog", "type": "scraping", "base_url": "https://openai.com/news/", "config": {"selector": "article", "title_selector": ["h1", "h2"], "date_selector": "time", "language": "en", "quality": "high"}, "category": "selskap", "priority": 8, "processor_config": {"max_age_days": 7, "min_relevance": 0.6}}, {"name": "Google AI Blog", "type": "scraping", "base_url": "https://ai.googleblog.com/", "config": {"selector": ".post", "title_selector": ["h2"], "date_selector": ".publishdate", "language": "en", "quality": "high"}, "category": "selskap", "priority": 7, "processor_config": {"max_age_days": 7, "min_relevance": 0.6}}, {"name": "Anthropic News", "type": "scraping", "base_url": "https://www.anthropic.com/news", "config": {"selector": "article", "title_selector": ["h1", "h2"], "language": "en", "quality": "high"}, "category": "selskap", "priority": 7, "processor_config": {"max_age_days": 7, "min_relevance": 0.6}}]'::jsonb)
  LOOP
    INSERT INTO public.content_sources (name, type, base_url, config, category, priority)
    VALUES (
      v_source->>'name',
      v_source->>'type',
      v_source->>'base_url',
      v_source->'config',
      v_source->>'category',
      COALESCE((v_source->>'priority')::integer, 5)
    )
    ON CONFLICT (name) DO UPDATE
      SET type = EXCLUDED.type,
          base_url = EXCLUDED.base_url,
          config = EXCLUDED.config,
          category = EXCLUDED.category,
          priority = EXCLUDED.priority,
          active = true,
          updated_at = NOW()
    RETURNING id INTO v_source_id;

    IF v_source_id IS NULL THEN
      SELECT id INTO v_source_id FROM public.content_sources WHERE name = v_source->>'name';
    END IF;

    INSERT INTO public.pipeline_sources (pipeline_id, source_id, priority, processor_config)
    VALUES (
      v_pipeline_id,
      v_source_id,
      COALESCE((v_source->>'priority')::integer, 5),
      COALESCE(v_source->'processor_config', '{}'::jsonb)
    )
    ON CONFLICT (pipeline_id, source_id) DO UPDATE
      SET priority = EXCLUDED.priority,
          processor_config = EXCLUDED.processor_config,
          active = true;
  END LOOP;
END
$$;
