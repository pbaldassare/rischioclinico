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
```

Lo schema Postgres è `rischio_clinico` (non `public`). Il client lo imposta con `createClient(url, key, { db: { schema: 'rischio_clinico' } })`.

## Accesso demo

Gli utenti Auth non sono ancora collegati: in home compare uno **switcher di profili** (email, senza password) letto da `rischio_clinico.profiles`.

| Email | Ruolo |
| --- | --- |
| operatore.ps@demo.asl | Operatore (PWA) |
| referente@demo.asl | Referente del rischio (backoffice) |
| sinistri@demo.asl | Amministrativo sinistri |
| direzione@demo.asl | Direzione |
| regione@demo.asl | Regione |
| broker@demo.asl | Broker |
| admin@demo.asl | Amministratore |

Quando Auth sarà collegato, la password prevista è `DemoRischio2026!`.

## Percorsi

- `/` login / switcher
- `/app` PWA: home, nuova segnalazione, coda, dettaglio (RCA P×M×R), profilo
- `/bo` backoffice: dashboard, segnalazioni, sinistri (importi), FDR, report per livello (reparto / presidio / azienda), 23 tipi sentinella

I dati sono quelli già seedati (ASP Messina demo).
