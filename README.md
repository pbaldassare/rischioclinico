# Rischio clinico

Piattaforma web (PWA + backoffice) per la gestione del rischio clinico-assicurativo: segnalazioni, fotografia del rischio, sinistri ed eventi sentinella.

Una sola app Vite + React + TypeScript. Tre livelli: **Admin**, **ASL / presidio**, **Operatore**. Su telefono (colonna max 480px, tab bar in basso) è la PWA di reparto; su desktop il backoffice con sidebar.

## Come avviare

```bash
npm install
npm run dev
```

Apre `http://localhost:8080`.

Build di produzione:

```bash
npm run build
npm run preview
```

Variabili opzionali (hanno già un default sul progetto Supabase demo):

```
VITE_SUPABASE_URL=https://gzuaxqxtfqmhhoafbmhm.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
OPENAI_API_KEY=<opzionale, solo server /api/assistente>
```

Senza `OPENAI_API_KEY` l’assistente usa una bozza locale. Lo schema Postgres è `rischio_clinico` (non `public`). Il client lo imposta con `createClient(url, key, { db: { schema: 'rischio_clinico' } })`.

## Accesso demo

Login reale su Supabase Auth (email + password). Gli utenti coincidono con `rischio_clinico.profiles.id`. Password unica: `DemoRischio2026!`

| Email | Livello | Entrata |
| --- | --- | --- |
| admin@demo.asl | Admin | `/bo` — crea ASL e ospedali, tutte le statistiche, richieste e sinistri |
| referente@demo.asl | ASL / presidio (ASP Messina) | `/bo` — solo Messina: reparti, operatori, sue stats |
| sinistri@demo.asl | ASL / presidio (AO Papardo) | `/bo` — solo Papardo |
| operatore.ps@demo.asl | Operatore | `/app` — PWA sul Pronto soccorso Taormina, con i privilegi dati dall’ASL |

I vecchi ruoli (referente, direzione, regione, broker, amministrativo sinistri) non sono più livelli di accesso.

## Percorsi

- `/` login email + password, con pulsante **Installa l’app**
- `/installa` pagina pubblica di installazione PWA
- `/app` PWA operatore: home, nuova segnalazione, coda, FDR se abilitato, profilo
- `/bo` backoffice Admin/ASL: dashboard, segnalazioni, sinistri, FDR, report, sentinella, legale; Admin anche anagrafica ASL; ASL anche reparti e operatori

Origine pubblica: `https://rischioclinico.pages.dev/`. Installazione: `https://rischioclinico.pages.dev/installa`. L’app installata parte da `/app`.

L’assistente propone solo bozze: l’operatore conferma prima di salvare. Non scrive da solo in archivio.

Non in questo rilascio: 2FA, offline, SIR avanzata, export SIMES.
