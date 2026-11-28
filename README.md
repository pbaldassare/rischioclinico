# Rischio clinico

Piattaforma web (PWA + backoffice) per la gestione del rischio clinico-assicurativo: segnalazioni, sinistri, eventi sentinella e relazione annuale.

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

Senza `OPENAI_API_KEY` l’assistente usa una bozza locale e il dettato (Whisper, `/api/trascrivi`) risponde 503. In produzione le due rotte `/api/*` sono Pages Functions (cartella `functions/`): la chiave va messa come secret `OPENAI_API_KEY` nel progetto Cloudflare Pages. Lo schema Postgres è `rischio_clinico` (non `public`). Il client lo imposta con `createClient(url, key, { db: { schema: 'rischio_clinico' } })`.

I dati demo sono inventati (`supabase/seed.sql`): ASL Nord e ASL Costa, ospedali e casi 2026. Non usano numeri o presidi reali. In `docs/sources/` resta un archivio di supporto ai report, non è l’azienda della demo.

## Accesso demo

Login reale su Supabase Auth (email + password). Gli utenti coincidono con `rischio_clinico.profiles.id`. Password unica: `DemoRischio2026!`

| Email | Livello | Entrata |
| --- | --- | --- |
| admin@demo.asl | Admin | `/bo` — crea ASL e ospedali, tutte le statistiche, richieste e sinistri |
| nord@demo.asl | ASL / presidio (ASL Nord) | `/bo` — solo ASL Nord: reparti, operatori, sue stats |
| costa@demo.asl | ASL / presidio (ASL Costa) | `/bo` — solo ASL Costa |
| operatore.nord@demo.asl | Operatore | `/app` — PWA sul Pronto soccorso Collina |
| operatore.costa@demo.asl | Operatore | `/app` — PWA sul Pronto soccorso Litorale |

I vecchi ruoli (referente, direzione, regione, broker, amministrativo sinistri) non sono più livelli di accesso.

## Percorsi

- `/` login email + password, con pulsante **Installa l’app**
- `/installa` pagina pubblica di installazione PWA
- `/app` PWA operatore: home, nuova segnalazione con l’assistente, profilo
- `/bo` backoffice Admin/ASL: dashboard, segnalazioni, sinistri, registro dei rischi, report (relazione annuale), sentinella, legale, reparti; Admin anche anagrafica ASL; ASL anche operatori. La fotografia del rischio (FDR) è nascosta: tabelle e dati restano.

Origine pubblica: `https://rischioclinico.pages.dev/`. Installazione: `https://rischioclinico.pages.dev/installa`. L’app installata parte da `/app`.

L’assistente propone solo bozze: l’operatore conferma prima di salvare. Non scrive da solo in archivio.

Non in questo rilascio: 2FA, offline, SIR avanzata, export SIMES.
