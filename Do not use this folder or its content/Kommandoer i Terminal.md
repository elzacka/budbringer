wvwcvdhrzhukhvuulgtd

## Starte lokal server
**npx next lint --no-interactive**
Kjører kun ESLint på prosjektet ditt én gang for å sjekke kodekvalitet/stil. Flagget --no-interactive gjør at Next.js ikke spør deg om å sette opp ESLint – den bare bruker konfigen du har eller hopper over.

**npm run dev**
starter utviklingsserveren (next dev), så appen kjører fortsatt mens du jobber. Den watcher filer, bygger på nytt og viser siden på http://localhost:3000.

**Kort sagt:** lint-kommandoen er en engangssjekk av koden, mens npm run dev holder appen din gående for utvikling.

## Stoppe lokal server
Trykk Ctrl+C for å avbryte

## Kjøre skript - dailyDigest.ts
npx ts-node --project tsconfig.scripts.json scripts/dailyDigest.ts

curl -i -X POST "https://budbringer-dispatch.lene-zachariassen.workers.dev" \
    -H "Authorization: Bearer Ir4tSI1QqYOHMHFP9oKtS7mR/IRPT2mLkT87UvqbJFY=" \
    -H "Content-Type: application/json" \
    -d '{}'
HTTP/2 207

## Kjøre epostutsendelse etter kjøring av skript
curl -i -X POST "https://budbringer-dispatch.lene-zachariassen.workers.dev" \
    -H "Authorization: Bearer Ir4tSI1QqYOHMHFP9oKtS7mR/IRPT2mLkT87UvqbJFY=" \
    -H "Content-Type: application/json" \
    -d '{}'