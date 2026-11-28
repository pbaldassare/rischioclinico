import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CAUSE, ESITI, NOME_CAUSA, NOME_ESITO, NOME_TIPOLOGIA, segno, type Relazione } from "@/lib/relazione";
import { formatEuro } from "@/lib/format";
import type { ReactNode } from "react";

const it = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("it-IT"));

const BLU = ["hsl(206 85% 43%)", "hsl(206 85% 30%)", "hsl(200 85% 60%)"];

/** La relazione annuale impaginata: otto sezioni, stampabile in A4. */
export function DocumentoRelazione({ r }: { r: Relazione }) {
  const data = new Date(r.generata_il).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const sez = (titolo: string, children: ReactNode) => (
    <section className="break-inside-avoid space-y-3">
      <h2 className="font-display text-lg font-bold">{titolo}</h2>
      {children}
    </section>
  );
  return (
    <article className="space-y-8 rounded-2xl border border-border bg-card p-6 text-sm print:border-0 print:p-0 sm:p-10">
      <header className="space-y-1 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rischio clinico · {r.azienda}</p>
        <h1 className="font-display text-3xl font-bold">Relazione annuale {r.anno}</h1>
        <p className="text-muted-foreground">Eventi avversi e risarcimenti. Relazione prevista dalla Legge 24/2017, art. 2 c. 5 e art. 4 c. 3.</p>
        <p className="text-xs text-muted-foreground">Generata dalla piattaforma il {data}.</p>
      </header>

      {sez("1. Sintesi generale", (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Kpi n={r.sintesi.segnalazioni} t={`segnalazioni nel ${r.anno}`} s={r.sintesi.varSegnalazioni != null ? `${segno(r.sintesi.varSegnalazioni)}% sul ${r.anno - 1}` : "nessun confronto"} />
            <Kpi n={r.sintesi.cadute} t="cadute" s={r.sintesi.tassoCadute != null ? `${it(r.sintesi.tassoCadute)} ogni 10.000 ricoveri` : "tasso non calcolabile"} />
            <Kpi n={r.sintesi.aggressioni} t="aggressioni a operatori" s={r.sintesi.varAggressioni != null ? `${segno(r.sintesi.varAggressioni)}% sul ${r.anno - 1}` : "nessun confronto"} />
            <Kpi n={r.sintesi.sentinella} t="eventi sentinella" s="da indagare con RCA" />
            <Kpi n={r.sintesi.analizzati} t="eventi analizzati" s={`${it(r.sintesi.quotaAnalizzati)}% delle segnalazioni`} />
            <Kpi n={r.sintesi.richieste} t="richieste di risarcimento" s={`generate da eventi ${r.anno}`} />
          </div>
          <div className="rounded-lg bg-secondary/60 p-4">
            <p className="font-semibold">In evidenza</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {r.sintesi.commenti.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </>
      ))}

      {sez("2. Analisi per tipologia", (
        <>
          <p className="text-muted-foreground">Ogni evento è contato una sola volta: prima per tipo (cadute, aggressioni), poi per gravità (sentinella, evento avverso, near miss); il resto confluisce in «altri eventi».</p>
          <Tabella testate={["Tipologia", ...r.anni.map(String), `Var. ${r.anno}/${String(r.anno - 1).slice(2)}`, `Quota ${r.anno}`]}>
            {r.perTipologia.map((t) => (
              <tr key={t.tipologia}>
                <td>{NOME_TIPOLOGIA[t.tipologia]}</td>
                {t.valori.map((v, i) => <td key={i} className="text-right">{v}</td>)}
                <td className="text-right">{t.var != null ? `${segno(t.var)}%` : "—"}</td>
                <td className="text-right">{it(t.quota)}%</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td>Totale segnalazioni</td>
              {r.anni.map((a, i) => <td key={a} className="text-right">{r.perTipologia.reduce((s, t) => s + t.valori[i], 0)}</td>)}
              <td className="text-right">{r.sintesi.varSegnalazioni != null ? `${segno(r.sintesi.varSegnalazioni)}%` : "—"}</td>
              <td className="text-right">100%</td>
            </tr>
          </Tabella>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={r.perTipologia.map((t) => ({ nome: NOME_TIPOLOGIA[t.tipologia], ...Object.fromEntries(r.anni.map((a, i) => [String(a), t.valori[i]])) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {r.anni.map((a, i) => <Bar key={a} dataKey={String(a)} fill={BLU[i]} radius={4} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ))}

      {sez("3. Analisi per reparto e per presidio", (
        <>
          <Tabella testate={["Reparto", "Cadute", "Aggress.", "Avversi", "Near miss", "Sentin.", "Altri", "Totale"]}>
            {r.perReparto.map((x) => (
              <tr key={x.reparto}>
                <td>{x.reparto}</td>
                <td className="text-right">{x.conteggi.cadute}</td>
                <td className="text-right">{x.conteggi.aggressioni}</td>
                <td className="text-right">{x.conteggi.avversi}</td>
                <td className="text-right">{x.conteggi.near_miss}</td>
                <td className="text-right">{x.conteggi.sentinella}</td>
                <td className="text-right">{x.conteggi.altri}</td>
                <td className="text-right font-semibold">{x.totale}</td>
              </tr>
            ))}
          </Tabella>
          <p className="font-semibold">Indicatori per presidio, {r.anno}</p>
          <Tabella testate={["Presidio", "Posti letto", "Ricoveri", "Segnalazioni", "Segn. ogni 1.000 ricoveri", "Cadute ogni 10.000 ricoveri"]}>
            {r.perPresidio.map((p) => (
              <tr key={p.presidio}>
                <td>{p.presidio}</td>
                <td className="text-right">{p.postiLetto ?? "—"}</td>
                <td className="text-right">{p.ricoveri?.toLocaleString("it-IT") ?? "—"}</td>
                <td className="text-right">{p.segnalazioni}</td>
                <td className="text-right">{it(p.tassoSegnalazioni)}</td>
                <td className="text-right">{it(p.tassoCadute)}</td>
              </tr>
            ))}
          </Tabella>
          <p className="text-xs text-muted-foreground">I tassi usano i ricoveri annui inseriti per ogni presidio: confrontano strutture di dimensioni diverse.</p>
        </>
      ))}

      {sez("4. Analisi delle cause", (
        <>
          <p className="text-muted-foreground">
            Nel {r.anno} sono stati analizzati con Root Cause Analysis {r.cause.analizzati} eventi. Ogni evento può avere più categorie di cause, quindi le percentuali non sommano a 100.
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {CAUSE.map((c) => (
              <div key={c} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{NOME_CAUSA[c]}</p>
                <p className="font-display text-2xl font-bold">{it(r.cause.quote[c])}%</p>
              </div>
            ))}
          </div>
          <Tabella testate={["Tipologia", "Analizzati", ...CAUSE.map((c) => NOME_CAUSA[c])]}>
            {r.cause.perTipologia.map((t) => (
              <tr key={t.tipologia}>
                <td>{NOME_TIPOLOGIA[t.tipologia]}</td>
                <td className="text-right">{t.analizzati}</td>
                {CAUSE.map((c) => <td key={c} className="text-right">{t.analizzati ? `${it(t.quote[c])}%` : "—"}</td>)}
              </tr>
            ))}
          </Tabella>
        </>
      ))}

      {sez("5. Gravità degli esiti", (
        <Tabella testate={["Tipologia", ...ESITI.map((e) => NOME_ESITO[e]), "Totale"]}>
          {r.esiti.map((e) => (
            <tr key={e.tipologia}>
              <td>{NOME_TIPOLOGIA[e.tipologia]}</td>
              {ESITI.map((k) => <td key={k} className="text-right">{e.conteggi[k]}</td>)}
              <td className="text-right font-semibold">{e.totale}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td>Totale</td>
            {ESITI.map((k) => <td key={k} className="text-right">{r.esiti.reduce((s, e) => s + e.conteggi[k], 0)}</td>)}
            <td className="text-right">{r.esiti.reduce((s, e) => s + e.totale, 0)}</td>
          </tr>
        </Tabella>
      ))}

      {sez(`6. Andamento storico ${r.anni[0]}–${r.anno}`, (
        <>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={r.storico.map((s) => ({ anno: String(s.anno), Segnalazioni: s.segnalazioni, Aggressioni: s.aggressioni }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="anno" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Segnalazioni" stroke={BLU[0]} strokeWidth={2} />
                <Line type="monotone" dataKey="Aggressioni" stroke={BLU[1]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Tabella testate={["Anno", "Segnalazioni", "Ricoveri", "Segn. ogni 1.000 ricoveri", "Cadute ogni 10.000 ricoveri", "Aggressioni"]}>
            {r.storico.map((s) => (
              <tr key={s.anno}>
                <td>{s.anno}</td>
                <td className="text-right">{s.segnalazioni}</td>
                <td className="text-right">{s.ricoveri?.toLocaleString("it-IT") ?? "—"}</td>
                <td className="text-right">{it(s.tassoSegnalazioni)}</td>
                <td className="text-right">{it(s.tassoCadute)}</td>
                <td className="text-right">{s.aggressioni}</td>
              </tr>
            ))}
          </Tabella>
          <p className="text-xs text-muted-foreground">Il confronto sui tassi, e non solo sui valori assoluti, separa la maggiore propensione a segnalare dalla variazione del rischio.</p>
        </>
      ))}

      {sez("7. Analisi assicurativa", (
        <>
          <p className="font-semibold">Eventi {r.anno} che hanno generato una richiesta di risarcimento</p>
          <Tabella testate={["Tipologia", "Eventi", "Con richiesta", "Quota", "Riserva"]}>
            {r.assicurativa.perTipologia.map((t) => (
              <tr key={t.tipologia}>
                <td>{NOME_TIPOLOGIA[t.tipologia]}</td>
                <td className="text-right">{t.eventi}</td>
                <td className="text-right">{t.richieste}</td>
                <td className="text-right">{t.eventi ? `${it(Math.round((t.richieste / t.eventi) * 1000) / 10)}%` : "—"}</td>
                <td className="text-right">{t.riserva ? formatEuro(t.riserva) : "—"}</td>
              </tr>
            ))}
          </Tabella>
          <p className="font-semibold">Risarcimenti dell’ultimo quinquennio (L. 24/2017, art. 4 c. 3)</p>
          <Tabella testate={["Anno di apertura", "Sinistri", "Liquidati", "Importo liquidato", "Ancora a riserva"]}>
            {r.assicurativa.perAnnoApertura.map((a) => (
              <tr key={a.anno}>
                <td>{a.anno}</td>
                <td className="text-right">{a.sinistri}</td>
                <td className="text-right">{a.liquidati}</td>
                <td className="text-right">{formatEuro(a.importoLiquidato)}</td>
                <td className="text-right">{formatEuro(a.riserva)}</td>
              </tr>
            ))}
          </Tabella>
        </>
      ))}

      {sez("8. Iniziative di miglioramento", (
        <>
          <p className="text-muted-foreground">Ogni evento analizzato genera azioni correttive con responsabile, scadenza e stato. Le azioni fatte vengono verificate: l’esito aggiorna l’indice di rischio del reparto.</p>
          <Tabella testate={["Anno evento", "Azioni", "Aperte", "In corso", "Fatte", "Verificate", "Efficaci sulle verificate"]}>
            {r.azioni.map((a) => (
              <tr key={a.anno}>
                <td>{a.anno}</td>
                <td className="text-right">{a.azioni}</td>
                <td className="text-right">{a.aperte}</td>
                <td className="text-right">{a.inCorso}</td>
                <td className="text-right">{a.fatte}</td>
                <td className="text-right">{a.verificate}</td>
                <td className="text-right">{a.verificate ? `${it(a.efficaci)}%` : "—"}</td>
              </tr>
            ))}
          </Tabella>
        </>
      ))}
    </article>
  );
}

function Kpi({ n, t, s }: { n: number; t: string; s: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="font-display text-3xl font-bold">{n}</p>
      <p className="font-semibold">{t}</p>
      <p className="text-xs text-muted-foreground">{s}</p>
    </div>
  );
}

function Tabella({ testate, children }: { testate: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_tr]:border-b [&_tr]:border-border">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            {testate.map((h, i) => (
              <th key={h} className={i === 0 ? "" : "text-right"}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
