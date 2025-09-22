# Budbringer – Systemoversikt

## 1. Komponenter forklart i menneskespråk

| Komponent                            | Hva det er                                               | Fordeler                                                                                                   | Hva den gjør i Budbringer                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js-app**                      | Frontenden – landingsside og admin bygd i React/Next.js. | Samler UI og API i samme prosjekt, god støtte for formvalidering og tilgangskontroll via serverless ruter. | Tar imot nye abonnenter, viser oversikt i admin og eksponerer API-endepunkter for påmelding (`app/api/subscribe/route.ts`) og administrasjon.                         |
| **Supabase**                         | Hosted Postgres med REST- og realtime-API.               | Moderne web-UI, innebygd sikkerhet (Row-Level Security, Policies), enkel integrasjon via service keys.     | Lagrer alle mottakere (`subscribers`), historikk (`digest_runs`), kildedata (`news_items`) og aktive prompts (`prompts`). Worker og script leser/oppdaterer via REST. |
| **`scripts/dailyDigest.ts`**         | Et TypeScript/Node-skript som kjøres én gang pr. dag.    | Kan kjøres lokalt, via CI eller cron. Samme kodebase som webappen = færre bevegelige deler.                | Henter RSS-kilder, rensker og lagrer artikler, kaller Anthropic Claude for å skrive teksten og oppdaterer Supabase + filer i `out/`.                                  |
| **GitHub Actions / manuell kjøring** | Jobben som starter skriptet og senere kaller worker-en.  | Automatisk planlegging, logging og enkel bruk av secrets.                                                  | Kjører kommandoen `npx ts-node --project tsconfig.scripts.json scripts/dailyDigest.ts` og deretter `curl`-kallet mot worker når digesten er klar.                     |
| **Cloudflare Worker**                | Et lite serverløst API-endepunkt.                        | Alltid tilgjengelig, trenger ingen egen server, enkel utrulling.                                           | Henter siste vellykkede digest og alle `confirmed` mottakere fra Supabase og sender e-post via MailChannels. Se `workers/email-dispatcher.js`.                        |
| **MailChannels**                     | E-posttjenesten som faktisk leverer nyhetsbrevet.        | Høy leveringsrate, Domain Lockdown beskytter mot spoofing, gratis kvote.                                   | Tar imot JSON fra worker med liste over mottakere og innhold; bruker `MAILCHANNELS_AUTH_TOKEN` (Bearer eller X-Api-Key).                                              |
| **Anthropic Claude**                 | Språkmodellen som skriver teksten.                       | God kvalitet, støtter omfattende systemprompts.                                                            | Får kontekst fra skriptet og produserer lead, seksjoner og eventuelt lydmanus (`audio_script`).                                                                       |

## 2. Prosessflyt (inn/ut per steg)

1. **Påmelding**  
   - *Input*: E-post og ev. metadata fra `SubscribeForm`.  
   - *Flyt*: Nettleser → `app/api/subscribe/route.ts` → Supabase REST.  
   - *Output*: Rad i `subscribers` med `status = confirmed` (eller oppdatering av eksisterende rad).

2. **Daglig generering (`scripts/dailyDigest.ts`)**  
   - *Startes av*: GitHub Actions eller manuelt `npx ts-node ...`.  
   - *Input*: RSS-kildelisten (`lib/news-sources.ts`), aktiv prompt (`prompts`), eksisterte artikler i Supabase.  
   - *Delsteg*:  
     1. Hent artikler via RSS, dedupliser og lagre i `news_items`.  
     2. Bygg konteksttekst (`buildContext`).  
     3. Kjør `callAnthropic` (Claude) for å produsere `lead`, `sections`, `actions`.  
     4. Lagre resultat i `digest_runs` med `status = success`, `summary_html/plain`, metadata `generated_at_local`.  
     5. Skriv `out/latest-digest.html|txt` for manuell kontroll.  
   - *Output*: Oppdatert Supabase (`news_items`, `digest_runs`) + lokal fil for inspeksjon.

3. **Utsending (Cloudflare Worker)**  
   - *Startes av*: GitHub Actions eller manuelt `curl` mot `$DISPATCH_URL`.  
   - *Input*: `DISPATCH_TOKEN`, Supabase service key, MailChannels token.  
   - *Flyt*: Worker → Supabase (`digest_runs` + `subscribers`) → personaliserer avmeldingslenker → MailChannels API.  
   - *Output*: E-poster til alle `confirmed` mottakere. 200 = alt OK, 207 = noen feilet, 404 = ingen digest klar.

4. **Oppfølging og avmelding**  
   - Admin-panelet leser `digest_runs` og `subscribers` for kontroll.  
   - Avmeldingslenker peker til `PUBLIC_SITE_URL` som verifiserer `UNSUBSCRIBE_SECRET` og setter status `unsubscribed`.

Se flyten som «Kilder → dailyDigest.ts → Supabase → (curl trigger) → Cloudflare Worker → MailChannels → Abonnenter», med sidegrener for påmelding/avmelding og admin.

## 3. Tekniske detaljer per modul

### 3.1 Next.js
- Påmelding håndteres i `app/api/subscribe/route.ts:17-73`; eksisterende brukere gjenaktiveres hvis de var `unsubscribed`.
- Admin-UI (`app/admin/page.tsx`) lister mottakere og digest-kjøringer.
- Klient og server deler miljøvariabler – se `NEXT_PUBLIC_*` for åpne nøkler vs. server-only på rot.

### 3.2 Supabase
- Tabeller definert i `types/database.types.ts:12-91`.
- Worker bruker Supabase REST (Authorization header med service key) (`workers/email-dispatcher.js:26-40`).
- Om du vil lagre råartikler i Supabase Storage kan scriptet utvides tilsvarende.

### 3.3 `scripts/dailyDigest.ts`
- Laster `.env.local` og `.env` (`scripts/dailyDigest.ts:1-4`).
- `getOsloNow()` sørger for korrekte dato-/tidsfelt (`scripts/dailyDigest.ts:49-102`).
- RSS-henting + deduplisering (`scripts/dailyDigest.ts:112-160`). Feil logges men stopper ikke kjøringen.
- LLM-kall og lagring (`scripts/dailyDigest.ts:183-344`).
- Feilhåndtering logger til Supabase (`scripts/dailyDigest.ts:346-372`).

### 3.4 Cloudflare Worker
- Sjekker HTTP-metode og `DISPATCH_TOKEN` (`workers/email-dispatcher.js:87-95`).
- Henter digest + mottakere, rendrer avmeldingslenker, sender via MailChannels (`workers/email-dispatcher.js:97-137`).
- Faller tilbake til `X-Api-Key` hvis tokenet ikke starter med `mct_` (`workers/email-dispatcher.js:68-74`).

### 3.5 MailChannels
- Oppsett: `_mailchannels.<domene>` TXT, API-key/token i `MAILCHANNELS_AUTH_TOKEN`, valgfritt SMTP-passord som fallback.
- Respons 4xx/5xx logges av worker og vises i Cloudflare UI.

## 4. Miljøvariabler
- Komplett liste i `docs/env-overview.csv` (inkluderer forklaring på kilde og hvor de skal legges).
- Kritiske secrets: `SUPABASE_SERVICE_ROLE_KEY`, `MAILCHANNELS_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `UNSUBSCRIBE_SECRET`, `DISPATCH_TOKEN`, `MAILCHANNELS_SMTP_PASSWORD`.
- Synkroniser alltid `.env.local`, Cloudflare Worker og GitHub Actions.

## 5. Forslag til diagram
1. **Swimlane**: Lag baner for (a) Bruker, (b) Next.js, (c) Supabase, (d) Script, (e) GitHub Actions, (f) Cloudflare Worker, (g) MailChannels, (h) Abonnent. Tegn pilene fra tabellen i seksjon 2.  
2. **Node/edge-diagram**:  
   - `RSS-kilder` → `dailyDigest.ts` → `news_items` + `digest_runs`.  
   - `curl/GitHub` → `Cloudflare Worker` → `MailChannels` → `Inbox`.  
   - `Subscribe form` → `subscribers`.  
   - `Admin UI` ↔ `Supabase`.

## 6. Mulige fremtidige  forbedringer
- Lagre artikler som markdown i Supabase Storage for mer robust kildedata.
- Legg til Slack/Teams-webhook for godkjenning av toppsaker før utsending.
- Hold `lib/news-sources.ts` oppdatert for å unngå 403/404-feil.

Dokumentet kan brukes som underlag for workflow-diagrammer, onboarding og teknisk dokumentasjon.
