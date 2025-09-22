# Driftsveiledning Budbringer

Denne guiden følger stegene 1–5 som må gjennomføres utenfor koden for å få Budbringer i produksjon. Kryss av hvert delsteg før du går videre. Henvisninger til filer i repoet er gitt der det er relevant.

---

## Steg 1 – Sett opp Supabase-prosjekt

1. **Opprett prosjekt** på [https://supabase.com](https://supabase.com) (Free tier holder).
   - Velg region nær brukerne (f.eks. `eu-central-1`).
   - Last ned `Project URL` og `anon`/`service` keys; du trenger dem senere (lagres i Secrets, ikke i repo).
2. **Installer Supabase CLI** (enten via Homebrew `brew install supabase/tap/supabase` eller den offisielle installeren).
3. **Koble mot prosjektet**
   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   ```
4. **Aktiver `vector`-extension** og kjør migrasjonen:
   ```bash
   supabase db push
   ```
   - Bekreft at tabellene `subscribers`, `prompts`, `digest_runs`, `news_items` er opprettet i Supabase Studio.
5. **Opprett Storage bucket for lyd (valgfritt men anbefalt)**
   - Supabase Studio → Storage → `Create bucket` → navn `digests`, sett Private.
6. **Konfigurer RLS og admin-roller**
   - I Supabase Studio → Authentication → Users: opprett admin-bruker (din e-post).
   - Sett `app_metadata` til `{ "roles": ["admin"] }` (API: `update auth.users` eller via Studio → Raw JSON).
   - Aktiver Magic Link + TOTP under Authentication → Providers.

**Verifisering:** Logg inn med Supabase SQL editor og kjør
```sql
select * from public.prompts;
```
Skal returnere tom liste uten feil.

---

## Steg 2 – Konfigurer secrets og miljøvariabler

1. **Lokal `.env.local`** (for Next.js utvikling)
   - Kopier `.env.example` til `.env.local` og fyll inn:
     - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
     - Minst én modellnøkkel (`ANTHROPIC_API_KEY` eller `OPENAI_API_KEY`)
     - `MAILCHANNELS_AUTH_TOKEN`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`
     - `PUBLIC_SITE_URL` (domenet der brukerne lander)
     - `UNSUBSCRIBE_SECRET` (egen generert streng, f.eks. ved `openssl rand -hex 32`)
     - Opsjonelt: `ENABLE_TTS=true`, `PIPER_VOICE`, `MAIL_REPLY_TO`
2. **GitHub Secrets** (Repository → Settings → Secrets and variables → Actions)
   - Opprett secrets for alle nøklene over + `DISPATCH_URL` og `DISPATCH_TOKEN` (kommer i steg 4).
   - Opprett eventuell `ENABLE_TTS` (verdi `true` eller `false`). Tomme felt fjernes fra workflow.
3. **Cloudflare Worker Secrets** (Workers → ditt prosjekt → Settings → Variables)
   - `SUPABASE_SERVICE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MAILCHANNELS_AUTH_TOKEN`
   - `MAIL_FROM_ADDRESS`
   - `MAIL_FROM_NAME`
   - `MAIL_REPLY_TO` (valgfritt)
   - `PUBLIC_SITE_URL`
   - `UNSUBSCRIBE_SECRET`
   - `DISPATCH_TOKEN` (bruk samme som GitHub secret for enkelhet)
4. **Supabase Secrets (Edge Functions / Config)**
   - Ikke nødvendig nå, men noter at service key aldri skal i klientkode.

**Verifisering:** `npm run lint` og `npm run dev` skal starte uten ENV-feil når `.env.local` er fylt.

---

## Steg 3 – Lokal testing av webapp og generator

1. **Installer avhengigheter**
   ```bash
   npm install
   ```
2. **Start utviklingsserver**
   ```bash
   npm run dev
   ```
   - Åpne `http://localhost:3000` → test påmeldingsskjema (forespørsel går mot Supabase; du skal se ny rad i `subscribers`).
   - Gå til `http://localhost:3000/admin/login` → bruk Supabase Magic Link for å logge inn (krever at du har konfigurert steg 1.6).
3. **Opprett en prompt** i admin-panelet (Prompter → skriv inn navn + systemprompt). Markér som aktiv.
4. **Kjør dagligskriptet manuelt**
   ```bash
   npx tsx scripts/dailyDigest.ts
   ```
   - Skal skrive `Digest generert for ...` i terminalen.
   - Sjekk Supabase `digest_runs` for ny rad med `status = success`.
   - Se `out/latest-digest.html|txt` for genererte filer.
5. **Valider e-postmal** ved å åpne `out/latest-digest.html` i nettleser; lenken for avmelding skal peke til `PUBLIC_SITE_URL/unsubscribe?...`.
6. **(Hvis TTS aktivert)** verifiser at `digest_runs.audio_url` har signert URL og at fil ligger i Supabase Storage `digests/audio/<id>.wav`.

**Feilsøking:**
- Manglende artikler → sjekk nettverkslogger (GitHub Actions vil ha samme begrensning).
- Modellfeil → kontroller API-nøkler og kvoter.

---

## Steg 4 – Deploy Cloudflare Worker og e-postdomene

1. **Forbered domene**
   - I domenets DNS (Cloudflare anbefales) sett SPF `v=spf1 include:relay.mailchannels.net -all`.
   - Legg til MailChannels DKIM (TXT `mc._domainkey` osv. følger av dokumentasjonen) og DMARC (f.eks. `v=DMARC1; p=quarantine; rua=mailto:dmarc@dittdomene.no`).
2. **Opprett Worker**
   - Cloudflare Dashboard → Workers & Pages → Create Worker → navngi `budbringer-dispatch`.
   - Lim inn koden fra `workers/email-dispatcher.ts`.
   - Under Settings → Triggers legg til HTTP endpoint (default). Noter `https://<worker>.workers.dev` som `DISPATCH_URL`.
3. **Legg inn Secrets** (se Steg 2.3). Bruk Cloudflare CLI `wrangler secret put` eller UI.
4. **Test Worker**
   - I Cloudflare UI → Quick edit → `Send` med POST, header `Authorization: Bearer <DISPATCH_TOKEN>`, body `{}`.
   - Skal returnere `Ing en ferdig digest` dersom du ikke har generert en enda.

**Verifisering:** Når `digest_runs` har en `success`, kjør `curl` lokalt:
```bash
curl -X POST "$DISPATCH_URL" \
  -H "Authorization: Bearer $DISPATCH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```
Status 200 og e-post i innboksen bekrefter oppsettet.

---

## Steg 5 – Sett opp CI-jobben og kjør heltest

1. **Opprett GitHub-repo** og push koden.
2. **Legg til Actions-secrets** (fra Steg 2.2). Sørg for at `DISPATCH_URL` peker til Cloudflare Worker.
3. **Aktiver workflow**
   - GitHub → Actions → `Daily Digest` → `Enable workflow` dersom deaktiver t.
   - Trykk `Run workflow` for å utløse manuelt første gang.
4. **Overvåk kjøringen**
   - Sjekk jobbloggen; stegene `Generate digest` og `Trigger dispatch worker` skal fullføre.
   - Supabase `digest_runs` skal ha oppdatert `status = success` og MailChannels skal ha sendt e-post.
5. **Planlegg påminnelser**
   - Sett opp varsling for feil (GitHub email/slack). Vurder å legge til `if: failure()`-steg som pinger deg.

**Endelig sjekkliste:**
- [ ] Supabase har tabeller + admin-rolle fungerer.
- [ ] Secrets er satt lokalt, i GitHub og Cloudflare.
- [ ] Manuell `dailyDigest` skriver `digest_runs`-rad og genererer filer.
- [ ] Worker sender e-post til minst én testmottaker.
- [ ] GitHub Actions-kjøring når Worker og Supabase uten feil.

Når alle avkrysninger er grønne er løsningen produksjonsklar. Dokumentasjonen i `docs/architecture.md` beskriver hvordan du kan bygge videre (monitorering, preferanser, osv.).
