# Rischio clinico

Piattaforma web (PWA + backoffice) per la gestione del rischio clinico-assicurativo: segnalazioni, fotografia del rischio, sinistri ed eventi sentinella.

Una sola app Vite + React + TypeScript. Su telefono (colonna max 480px, tab bar in basso) è la PWA di reparto; su desktop il backoffice con sidebar.

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

Login reale su Supabase Auth (email + password). Gli utenti coincidono con `rischio_clinico.profiles.id`.

| Email | Ruolo | Entrata |
| --- | --- | --- |
| operatore.ps@demo.asl | Operatore (PWA) | `/app` |
| referente@demo.asl | Referente del rischio | `/bo` |
| sinistri@demo.asl | Amministrativo sinistri | `/bo` |
| direzione@demo.asl | Direzione | `/bo` |
| regione@demo.asl | Regione | `/bo` |
| broker@demo.asl | Broker | `/bo` |
| admin@demo.asl | Amministratore | `/bo` |

Password unica: `DemoRischio2026!`

## Percorsi

- `/` login email + password, con pulsante **Installa l’app**
- `/installa` pagina pubblica di installazione PWA (stesso controllo nativo / istruzioni iOS)
- `/app` PWA: home (install visibile), nuova segnalazione (assistente voce/foto, allegati), coda, dettaglio (RCA P×M×R), profilo
- `/bo` backoffice: dashboard, segnalazioni, sinistri, FDR, report per livello, 23 tipi sentinella, pratiche legali in consultazione

Origine pubblica: `https://rischioclinico.pages.dev/`. Installazione: `https://rischioclinico.pages.dev/installa`. L’app installata parte da `/app`.

L’assistente propone solo bozze: l’operatore conferma prima di salvare. Non scrive da solo in archivio.

Non in questo rilascio: 2FA, offline, SIR avanzata, cruscotto Regione, export SIMES.
