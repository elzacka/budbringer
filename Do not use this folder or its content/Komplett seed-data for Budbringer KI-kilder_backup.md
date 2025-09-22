## 1. Pipeline INSERT

sql

```sql
INSERT INTO pipelines (name, purpose, config, template_config) VALUES 
('KI-nyheter Norge', 'ki-nyheter', 
'{
  "ai_editor_prompt": "Du er redaktør for et norsk KI-nyhetsbrev. Prioriter saker som er relevante for norske lesere, tech-miljøet og som kan påvirke Norge. Fokuser på praktiske anvendelser, forskningsnytt fra norske miljøer, regelverksendringer og teknologiutvikling som berører nordmenn.",
  "max_articles": 15,
  "require_approval": false,
  "filter_strength": "high"
}',
'{
  "language": "no",
  "tone": "profesjonell_tilgjengelig",
  "target_audience": "norske brukere/lesere med ulik kompetanse og erfaring med KI og teknologi generelt",
  "style_guide": "Bruk korrekt norsk, klarspråk, bevar engelske fagtermer og egennavn"
}'
);
```

## 2. Content Sources INSERT (alle 13 kilder)

sql

```sql
INSERT INTO content_sources (name, type, base_url, config, category, priority) VALUES 

-- Norske kilder (høyest prioritet)
('NRK Viten', 'rss', 'https://www.nrk.no/viten/toppsaker.rss', 
'{
  "filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "roboter", "automatisering", "digitalisering"],
  "language": "no",
  "quality": "high"
}', 'norsk-media', 10),

('NRK Nyheter', 'rss', 'https://www.nrk.no/nyheter/siste.rss', 
'{
  "filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI"],
  "language": "no",
  "quality": "high"
}', 'norsk-media', 9),

('Forskningsrådet', 'scraping', 'https://www.forskningsradet.no/forskningspolitikk-strategi/ltp/kunstig-intelligens/', 
'{
  "selector": "article",
  "title_selector": "h1,h2,h3",
  "date_selector": "time",
  "filter_keywords": ["KI", "forskning", "milliard"],
  "language": "no",
  "quality": "high"
}', 'norsk-forskning', 10),

('Norwegian SciTech News', 'rss', 'https://norwegianscitechnews.com/feed', 
'{
  "filter_keywords": ["artificial intelligence", "AI", "machine learning", "robotics", "NTNU", "SINTEF"],
  "language": "en",
  "norwegian_relevance": true
}', 'norsk-forskning', 8),

('AIavisen.no', 'scraping', 'https://aiavisen.no/ai-nyheter/', 
'{
  "selector": "article",
  "title_selector": "h2,h3",
  "filter_keywords": ["Norge", "norsk", "skandinavisk"],
  "language": "no",
  "quality": "medium"
}', 'spesialisert-ai', 7),

-- Tekniske norske medier
('Digi.no Generell', 'scraping', 'https://www.digi.no/', 
'{
  "selector": "article",
  "title_selector": "h1,h2",
  "filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI"],
  "language": "no",
  "check_interval": "hourly"
}', 'norsk-tech', 8),

('ITavisen', 'rss', 'https://itavisen.no/feed', 
'{
  "filter_keywords": ["kunstig intelligens", "KI", "AI", "maskinlæring", "OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "roboter", "automatisering", "digitalisering"],
  "language": "no"
}', 'norsk-tech', 7),

-- Internasjonale kilder med høy kvalitet
('TechCrunch AI', 'rss', 'https://techcrunch.com/category/artificial-intelligence/feed/', 
'{
  "filter_keywords": ["OpenAI", "Google", "Microsoft", "Anthropic", "breakthrough", "funding"],
  "language": "en",
  "quality": "high"
}', 'internasjonal', 6),

('MIT Technology Review AI', 'rss', 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', 
'{
  "filter_keywords": ["research", "breakthrough", "ethics", "policy"],
  "language": "en",
  "quality": "high"
}', 'internasjonal', 6),

('The Verge AI', 'rss', 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', 
'{
  "filter_keywords": ["OpenAI", "ChatGPT", "GPT", "Anthropic", "Claude", "Claude.ai", "Gemini", "Copilot", "MetaAI", "xAI", "Grok", "ElevenLabs", "GoogleAI", "Google", "Microsoft", "regulation", "EU"],
  "language": "en",
  "quality": "high"
}', 'internasjonal', 5),

-- Selskaps-/forskningsblogs
('OpenAI Blog', 'scraping', 'https://openai.com/news/', 
'{
  "selector": "article",
  "title_selector": "h1,h2",
  "date_selector": "time",
  "language": "en",
  "quality": "high"
}', 'selskap', 8),

('Google AI Blog', 'scraping', 'https://ai.googleblog.com/', 
'{
  "selector": ".post",
  "title_selector": "h2",
  "date_selector": ".publishdate",
  "language": "en",
  "quality": "high"
}', 'selskap', 7),

('Anthropic News', 'scraping', 'https://www.anthropic.com/news', 
'{
  "selector": "article",
  "title_selector": "h1,h2",
  "language": "en",
  "quality": "high"
}', 'selskap', 7);
```

## 3. Pipeline-Source Mapping INSERT

sql

```sql
INSERT INTO pipeline_sources (pipeline_id, source_id, priority, processor_config) 
SELECT 1, id, 
  CASE 
    WHEN category = 'norsk-forskning' THEN 10
    WHEN category = 'norsk-media' THEN 9
    WHEN category = 'norsk-tech' THEN 8
    WHEN category = 'selskap' THEN 7
    WHEN category = 'internasjonal' THEN 5
    WHEN category = 'spesialisert-ai' THEN 7
    ELSE 3
  END,
  '{"max_age_days": 3, "min_relevance": 0.6}'::jsonb
FROM content_sources;
```

## Oppsummering av seed-dataen:

- **1 pipeline**: KI-nyheter Norge med norsk konfigurering
- **13 kilder** fordelt på:
    - 2 NRK RSS-feeds (norsk-media)
    - 2 forskningsinstitusjoner (norsk-forskning)
    - 1 spesialisert KI-side (spesialisert-ai)
    - 2 tekniske norske medier (norsk-tech)
    - 3 internasjonale kilder (internasjonal)
    - 3 selskapsblogs (selskap)
- **13 koblinger** mellom pipeline og kilder med norsk prioritering

Alle kilder har utvidede filter_keywords som dekker både norske og engelske KI-termer, samt populære produktnavn som ChatGPT, Claude, Gemini etc.

Retry

[Claude can make mistakes.  
Please double-check responses.](https://support.anthropic.com/en/articles/8525154-claude-is-providing-incorrect-or-misleading-responses-what-s-going-on)