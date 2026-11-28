import type { AttivitaPresidio, Presidio, Segnalazione, Sinistro, UnitaOperativa } from "./types";
import { rcaDi } from "./queries";
import { sommaMovimenti } from "./format";

/** Le sei tipologie della relazione annuale. Ogni evento conta una volta: prima il tipo, poi la gravità. */
export const TIPOLOGIE = ["cadute", "aggressioni", "avversi", "near_miss", "sentinella", "altri"] as const;
export type Tipologia = (typeof TIPOLOGIE)[number];
export const NOME_TIPOLOGIA: Record<Tipologia, string> = {
  cadute: "Cadute",
  aggressioni: "Aggressioni",
  avversi: "Eventi avversi",
  near_miss: "Near miss",
  sentinella: "Eventi sentinella",
  altri: "Altri eventi",
};
export const ESITI = ["nessuno", "lieve", "moderato", "severo", "morte"] as const;
export const NOME_ESITO: Record<(typeof ESITI)[number], string> = { nessuno: "Nessun danno", lieve: "Lieve", moderato: "Moderata", severo: "Grave", morte: "Decesso" };
export const CAUSE = ["organizzative", "procedurali", "umane", "tecnologiche"] as const;
export const NOME_CAUSA: Record<(typeof CAUSE)[number], string> = { organizzative: "Organizzative", procedurali: "Procedurali", umane: "Umane", tecnologiche: "Tecnologiche" };

export function tipologiaDi(s: Segnalazione): Tipologia {
  if (s.tipo_evento_codice === "caduta") return "cadute";
  if (s.tipo_evento_codice === "violenza_operatore" || s.tipo_evento_codice === "violenza_paziente") return "aggressioni";
  if (s.sentinella || s.gravita_codice === "evento_sentinella") return "sentinella";
  if (s.gravita_codice === "evento_avverso") return "avversi";
  if (s.gravita_codice === "near_miss" || s.gravita_codice === "evento_senza_danno") return "near_miss";
  return "altri";
}

type PerTipologia = Record<Tipologia, number>;
const vuoto = (): PerTipologia => ({ cadute: 0, aggressioni: 0, avversi: 0, near_miss: 0, sentinella: 0, altri: 0 });

export interface Relazione {
  azienda: string;
  anno: number;
  anni: number[];
  generata_il: string;
  sintesi: {
    segnalazioni: number;
    varSegnalazioni: number | null;
    cadute: number;
    tassoCadute: number | null;
    aggressioni: number;
    varAggressioni: number | null;
    sentinella: number;
    analizzati: number;
    quotaAnalizzati: number;
    richieste: number;
    commenti: string[];
  };
  perTipologia: { tipologia: Tipologia; valori: number[]; var: number | null; quota: number }[];
  perReparto: { reparto: string; conteggi: PerTipologia; totale: number }[];
  perPresidio: { presidio: string; postiLetto: number | null; ricoveri: number | null; segnalazioni: number; tassoSegnalazioni: number | null; tassoCadute: number | null }[];
  cause: { analizzati: number; quote: Record<(typeof CAUSE)[number], number>; perTipologia: { tipologia: Tipologia; analizzati: number; quote: Record<(typeof CAUSE)[number], number> }[] };
  esiti: { tipologia: Tipologia; conteggi: Record<(typeof ESITI)[number], number>; totale: number }[];
  storico: { anno: number; segnalazioni: number; ricoveri: number | null; tassoSegnalazioni: number | null; tassoCadute: number | null; aggressioni: number }[];
  assicurativa: {
    perTipologia: { tipologia: Tipologia; eventi: number; richieste: number; riserva: number }[];
    perAnnoApertura: { anno: number; sinistri: number; liquidati: number; importoLiquidato: number; riserva: number }[];
  };
  azioni: { anno: number; azioni: number; aperte: number; inCorso: number; fatte: number; verificate: number; efficaci: number }[];
}

function annoDi(v?: string | null) {
  return v ? new Date(v).getFullYear() : null;
}
function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}
function variazione(cur: number, prev: number): number | null {
  return prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
}
function tasso(n: number, ricoveri: number | null, per: number): number | null {
  return ricoveri ? Math.round((n / ricoveri) * per * 10) / 10 : null;
}

export function calcolaRelazione(input: {
  azienda: string;
  anno: number;
  segnalazioni: Segnalazione[];
  sinistri: Sinistro[];
  attivita: AttivitaPresidio[];
  presidi: Presidio[];
  unita: UnitaOperativa[];
}): Relazione {
  const { azienda, anno, sinistri, attivita, presidi, unita } = input;
  const anni = [anno - 2, anno - 1, anno];
  const perAnno = (a: number) => input.segnalazioni.filter((s) => annoDi(s.data_ora_evento) === a);
  const segN = perAnno(anno);
  const segPrev = perAnno(anno - 1);
  const ricoveriAnno = (a: number, presidioId?: string) => {
    const righe = attivita.filter((x) => x.anno === a && (!presidioId || x.presidio_id === presidioId));
    return righe.length ? righe.reduce((t, x) => t + (x.ricoveri ?? 0), 0) : null;
  };
  const conta = (lista: Segnalazione[]) => lista.reduce((acc, s) => ((acc[tipologiaDi(s)] += 1), acc), vuoto());
  const contaN = conta(segN);
  const contaPrev = conta(segPrev);

  // 2. tipologie su tre anni
  const perTipologia = TIPOLOGIE.map((t) => {
    const valori = anni.map((a) => conta(perAnno(a))[t]);
    return { tipologia: t, valori, var: variazione(valori[2], valori[1]), quota: pct(valori[2], segN.length) };
  });

  // 3. reparti e presidi
  const perReparto = unita
    .map((u) => {
      const mie = segN.filter((s) => s.unita_operativa_id === u.id);
      return { reparto: `${u.nome} · ${presidi.find((p) => p.id === u.presidio_id)?.nome ?? ""}`, conteggi: conta(mie), totale: mie.length };
    })
    .filter((r) => r.totale > 0)
    .sort((a, b) => b.totale - a.totale);
  const perPresidio = presidi.map((p) => {
    const mie = segN.filter((s) => s.presidio_id === p.id);
    const ric = ricoveriAnno(anno, p.id);
    return {
      presidio: p.nome,
      postiLetto: p.posti_letto,
      ricoveri: ric,
      segnalazioni: mie.length,
      tassoSegnalazioni: tasso(mie.length, ric, 1000),
      tassoCadute: tasso(conta(mie).cadute, ric, 10000),
    };
  });

  // 4. cause (dalle RCA)
  const analizzate = segN.filter((s) => rcaDi(s));
  const quoteCause = (lista: Segnalazione[]) => {
    const q = { organizzative: 0, procedurali: 0, umane: 0, tecnologiche: 0 };
    for (const s of lista) for (const c of rcaDi(s)?.cause ?? []) if (c in q) q[c as keyof typeof q] += 1;
    return { organizzative: pct(q.organizzative, lista.length), procedurali: pct(q.procedurali, lista.length), umane: pct(q.umane, lista.length), tecnologiche: pct(q.tecnologiche, lista.length) };
  };
  const cause = {
    analizzati: analizzate.length,
    quote: quoteCause(analizzate),
    perTipologia: TIPOLOGIE.map((t) => {
      const lista = analizzate.filter((s) => tipologiaDi(s) === t);
      return { tipologia: t, analizzati: lista.length, quote: quoteCause(lista) };
    }),
  };

  // 5. esiti
  const esiti = TIPOLOGIE.map((t) => {
    const lista = segN.filter((s) => tipologiaDi(s) === t);
    const conteggi = { nessuno: 0, lieve: 0, moderato: 0, severo: 0, morte: 0 };
    for (const s of lista) {
      const m = (s.magnitudo_codice ?? "nessuno") as keyof typeof conteggi;
      conteggi[m in conteggi ? m : "nessuno"] += 1;
    }
    return { tipologia: t, conteggi, totale: lista.length };
  });

  // 6. storico
  const storico = anni.map((a) => {
    const lista = perAnno(a);
    const ric = ricoveriAnno(a);
    return { anno: a, segnalazioni: lista.length, ricoveri: ric, tassoSegnalazioni: tasso(lista.length, ric, 1000), tassoCadute: tasso(conta(lista).cadute, ric, 10000), aggressioni: conta(lista).aggressioni };
  });

  // 7. assicurativa
  const idN = new Set(segN.map((s) => s.id));
  const sinistriDaEventiN = sinistri.filter((x) => x.segnalazione_id && idN.has(x.segnalazione_id));
  const assicurativa = {
    perTipologia: TIPOLOGIE.map((t) => {
      const eventi = segN.filter((s) => tipologiaDi(s) === t);
      const ids = new Set(eventi.map((s) => s.id));
      const richieste = sinistriDaEventiN.filter((x) => ids.has(x.segnalazione_id!));
      return { tipologia: t, eventi: eventi.length, richieste: richieste.length, riserva: richieste.reduce((a, x) => a + sommaMovimenti(x.movimenti, ["riservato"]), 0) };
    }),
    perAnnoApertura: [anno - 4, anno - 3, anno - 2, anno - 1, anno].map((a) => {
      const lista = sinistri.filter((x) => annoDi(x.data_apertura ?? x.data_denuncia ?? x.data_evento) === a);
      const liquidati = lista.filter((x) => x.stato === "liquidato" || sommaMovimenti(x.movimenti, ["liquidato"]) > 0);
      return {
        anno: a,
        sinistri: lista.length,
        liquidati: liquidati.length,
        importoLiquidato: lista.reduce((s, x) => s + sommaMovimenti(x.movimenti, ["liquidato"]), 0),
        riserva: lista.reduce((s, x) => s + sommaMovimenti(x.movimenti, ["riservato"]), 0),
      };
    }),
  };

  // 8. azioni
  const azioni = anni.map((a) => {
    const tutte = perAnno(a).flatMap((s) => s.azioni ?? []);
    const verificate = tutte.filter((x) => x.stato === "verificata");
    return {
      anno: a,
      azioni: tutte.length,
      aperte: tutte.filter((x) => x.stato === "aperta").length,
      inCorso: tutte.filter((x) => x.stato === "in_corso").length,
      fatte: tutte.filter((x) => x.stato === "fatta").length,
      verificate: verificate.length,
      efficaci: pct(verificate.filter((x) => x.esito_verifica === "efficace").length, verificate.length),
    };
  });

  // 1. sintesi e commenti (frasi fisse costruite sui numeri, niente modello)
  const ricN = ricoveriAnno(anno);
  const varSeg = variazione(segN.length, segPrev.length);
  const commenti: string[] = [];
  if (varSeg != null) commenti.push(`Le segnalazioni passano da ${segPrev.length} a ${segN.length} (${segno(varSeg)}% sul ${anno - 1}).`);
  else commenti.push(`${segN.length} segnalazioni nel ${anno}; nessun dato del ${anno - 1} per il confronto.`);
  const nessunDanno = esiti.find((e) => e.tipologia === "cadute")?.conteggi.nessuno ?? 0;
  if (contaN.cadute) commenti.push(`Le cadute sono ${contaN.cadute}${ricN ? `, pari a ${tasso(contaN.cadute, ricN, 10000)?.toLocaleString("it-IT")} ogni 10.000 ricoveri` : ""}; il ${pct(nessunDanno, contaN.cadute).toLocaleString("it-IT")}% non ha prodotto danni.`);
  if (contaPrev.near_miss && contaN.near_miss < contaPrev.near_miss) commenti.push("Il calo dei near miss va monitorato: è un segnale di minore propensione a segnalare, non di minore rischio.");
  const azN = azioni[2];
  if (azN.verificate) commenti.push(`Delle ${azN.azioni} azioni correttive del ${anno}, ${azN.verificate} sono state verificate; il ${azN.efficaci.toLocaleString("it-IT")}% è risultato efficace.`);
  if (!ricN) commenti.push("I tassi per ricovero non sono calcolabili: inserire i ricoveri annui di ogni presidio in Reparti → Ricoveri.");

  return {
    azienda,
    anno,
    anni,
    generata_il: new Date().toISOString(),
    sintesi: {
      segnalazioni: segN.length,
      varSegnalazioni: varSeg,
      cadute: contaN.cadute,
      tassoCadute: tasso(contaN.cadute, ricN, 10000),
      aggressioni: contaN.aggressioni,
      varAggressioni: variazione(contaN.aggressioni, contaPrev.aggressioni),
      sentinella: contaN.sentinella,
      analizzati: analizzate.length,
      quotaAnalizzati: pct(analizzate.length, segN.length),
      richieste: sinistriDaEventiN.length,
      commenti,
    },
    perTipologia,
    perReparto,
    perPresidio,
    cause,
    esiti,
    storico,
    assicurativa,
    azioni,
  };
}

export function segno(v: number | null) {
  if (v == null) return "—";
  return `${v > 0 ? "+" : ""}${v.toLocaleString("it-IT")}`;
}
