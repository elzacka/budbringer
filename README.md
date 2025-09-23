# Budbringer

Fullstack-prosjekt for daglig KI-brief sendt på e-post til norske mottakere.

## Innhold

- Next.js-app (`app/`) for offentlig landingsside og admin-panel.
- Supabase Postgres (schema i `supabase/migrations`) for mottakere, prompts og kjøringslogger.
- Daglig GitHub Actions-jobb (`.github/workflows`) som henter nyheter, kjører KI-modell og lagrer resultat.
- Cloudflare Worker (`workers/email-dispatcher.ts`) som sender e-post via MailChannels gratisnivået.

## Kom i gang lokalt

1. Installer Node 20 og npm.
2. Kopier `.env.example` til `.env.local` og fyll inn Supabase-prosjektet ditt. For lokal utvikling kan du bruke supabase CLI.
3. Kjør `npm install`.
4. Kjør `npm run dev` for å starte Next.js.

### Tilkobling til Supabase

- Kjør migrasjonene ved hjelp av Supabase CLI: `supabase db push` eller `supabase migration up`.
- Marker admin-brukere med `app_metadata.roles = ['admin']` i Supabase Auth.

### Viktige `env`

| Variabel | Beskrivelse |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Offentlige nøkler for webapp (bruk Supabase Publishable Key). |
| `SUPABASE_SERVICE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Service key/API key brukes av API-endepunkter og cron-jobb. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Minst én må settes for nattlig generering. |
| `MAILCHANNELS_AUTH_TOKEN` | API-token fra MailChannels. |
| `PUBLIC_SITE_URL` | Base-URL for signerte lenker. |
| `UNSUBSCRIBE_SECRET` | Hemmelig nøkkel for signerte avmeldingslenker. |

## Produksjonsflyt

1. GitHub Action kjøres 05:30 CET, genererer oppsummering via `scripts/dailyDigest.ts`.
2. Resultat lagres i `digest_runs` og eventuelt `news_items`.
3. Action trigger Cloudflare Worker (`workers/email-dispatcher.ts`) via hemmelig webhook.
4. Worker henter siste `digest_run`, rendrer e-post og sender ut via MailChannels.

## TTS-utvidelse

- Sett `ENABLE_TTS=true` og `PIPER_VOICE` i GitHub secrets for å aktivere piper-baserte lydfiler.
- Lyd lagres i Supabase Storage (bucket `digests`) og lenke legges ved i e-poster.

## Videre arbeid

- Implementer preferanser per mottaker (temaer, format).
- Legg til Slack/Teams-integrasjon for alternative leveransekanaler.
- Overvåk workflows med f.eks. Better Uptime eller GitHub Checks.
