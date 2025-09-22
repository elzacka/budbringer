# Budbringer – Arkitektur

Denne dokumentasjonen beskriver hvordan løsningen er strukturert, hvilke verktøy som brukes, og hvilke manuelle steg som må gjøres utenfor koden.

## Oversikt

| Del | Teknologi | Beskrivelse |
| --- | --- | --- |
| Webapp | Next.js 14, Supabase Auth | Landingsside for nye mottakere og passordløst admin-grensesnitt. |
| Databasesjema | Supabase Postgres | Tabeller for mottakere, prompter, kjøringer og caches av nyhetssaker. |
| Automatisering | GitHub Actions (cron) | Nattlig jobb som henter nyheter, kaller KI-modell, genererer e-post og evt. lyd. |
| Utsending | Cloudflare Worker + MailChannels | Liten Worker som henter siste oppsummering og sender e-post via gratis kvote. |
| Lyd (opsjon) | piper TTS | Genererer norsk lydfil og laster denne opp til Supabase Storage. |

## Webapplikasjon

- `app/page.tsx` – offentlig landingsside med påmeldingsskjema.
- `app/admin/*` – adminsider for mottakere, prompter og historikk. Beskyttes av Supabase Auth (magic link + TOTP).
- API-endepunkter i `app/api/*` bruker Supabase service key for å skrive til databasen, men krever samtidig admin-session for sikkerhet.
- `middleware.ts` sørger for at /admin-ruter krever innlogging.

### Miljøvariabler

Se `.env.example` for komplett liste. Viktige nøkler lagres som Secrets i GitHub, Supabase og Cloudflare.

## Databasestruktur

Migrasjonene i `supabase/migrations` oppretter:

- `subscribers` – mottakere av e-post (status, språk, preferanser, sist sendt)
- `prompts` – historikk og aktiv prompt for KI-oppsummeringen
- `digest_runs` – logg over nattlige kjøringer
- `news_items` – cache av hentede nyheter, inkludert `vector`-embedding for deduplisering

RLS-policyer begrenser tilgangen til admin-roller. Administrasjonsoperasjoner bruker service key på serversiden.

## Automatisering (cron)

Workflow `/.github/workflows/daily-digest.yml` kjører daglig 05:30 CET:

1. Henter prosjektet, installerer avhengigheter og logger inn i Supabase via service key.
2. Kaller `scripts/dailyDigest.ts` som:
   - Henter aktive nyhetskilder (`lib/news-sources.ts`) og laster ned RSS/Atom.
   - Renser og dedupliserer artikler ved hjelp av `sentence-transformers` (kjøres lokalt i workflow via `pip install`/`python -m pip`).
   - Bygger en kontekst (markdown) og kaller valgt KI-modell (Claude prioritet, fallback GPT-4o mini).
   - Lagrer sammendrag, metadata og eventuelle feil i `digest_runs`.
   - Dersom TTS er aktivert, kjører `scripts/tts/generateAudio.ts` som bruker `piper` og laster filen opp i Supabase Storage.
3. Setter status i `digest_runs` til `success` eller `failed` og skriver en kort logg.
4. Trigger Cloudflare Worker via webhook for å sende e-post.

## E-postutsending

- Worker-kode i `workers/email-dispatcher.ts` henter siste vellykkede `digest_run`, rendrer HTML/tekst via `lib/email.ts` og sender e-post gjennom MailChannels (gratis kvote).
- Hver e-post får en signert avmeldingslenke (`subscribers.status = 'unsubscribed'`).
- Opsjonelt legges URL til lydfil i både HTML og tekst.

## Sikkerhet og personvern

- Brukerdata: Kun e-post, språk og preferanser; ingen sensitive felt.
- Logging: Aggregert, ingen persondata i ClearText (kun `digest_runs.metadata`).
- Secrets håndteres via GitHub/Cloudflare/Supabase Secret Manager og dokumentert i `docs/runbook.md` (kommer).
- Backup: Supabase PITR + eksport av `digest_runs`/`prompts` ukentlig (kan automatiseres i egen workflow).

## Manuelle oppgaver

1. Opprett Supabase-prosjekt, aktiver `vector`-extension, migrer schema, opprett admin-brukere.
2. Konfigurer Supabase Auth med magic link + TOTP og sett `app_metadata.roles = ['admin']` for deg selv.
3. Sett opp Cloudflare-konto, domene og MailChannels (verifiser SPF, DKIM, DMARC).
4. Opprett GitHub-repo, legg inn secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` osv.).
5. Opprett Cloudflare Worker med koden i `workers/email-dispatcher.ts` og secret tokens.
6. Test hele flyten manuelt før produksjon: registrering, admin login, kjøre `dailyDigest.ts` lokalt, sende test-e-post.

## Videre arbeid

- Legg til audit-logg i Supabase for admin-handlinger.
- Bygg preferansesenter for mottakere (HTML/tekst, temaer).
- Integrer observabilitet (Logflare/Sentry) for cron-jobb og Worker.
- Implementer fallback til open-source LLM (Mixtral) via selvhostet runner.
