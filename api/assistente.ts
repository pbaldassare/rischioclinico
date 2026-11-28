export type AssistenteTipo = "segnalazione" | "rca" | "report";

export interface AssistenteRichiesta {
  tipo: AssistenteTipo;
  testo?: string;
  immagini?: { mime: string; data: string }[];
  contesto?: Record<string, unknown>;
}

export interface SchedaProposta {
  tipo_evento?: string;
  danno?: "nessuno" | "lieve" | "grave";
  fase_cura?: string;
  luogo?: string;
  sentinella?: boolean;
  tipo_sentinella?: number | null;
  data_ora?: string | null;
}

export interface AssistenteRisposta {
  fonte: "modello" | "modello_locale";
  avviso: string;
  testo: string;
  scheda?: SchedaProposta;
  p?: number;
  m?: number;
  r?: number;
  fattori?: string;
}

export async function handleAssistente(body: AssistenteRichiesta, chiave?: string): Promise<AssistenteRisposta> {
  const tipo = body.tipo ?? "segnalazione";
  const testo = (body.testo ?? "").trim();
  const key = chiave?.trim();
  if (key) {
    try {
      return await conModello(key, tipo, testo, body.immagini ?? [], body.contesto ?? {});
    } catch {
      const mock = bozzaLocale(tipo, testo, body.contesto ?? {});
      return { ...mock, avviso: "Modello non raggiungibile: bozza locale. Controlla e conferma prima di salvare." };
    }
  }
  return bozzaLocale(tipo, testo, body.contesto ?? {});
}

/** Audio registrato dal browser -> testo italiano via Whisper. Senza chiave risponde 503. */
export async function handleTrascrizione(audio: Blob, chiave?: string): Promise<Response> {
  const key = chiave?.trim();
  if (!key) return Response.json({ error: "Trascrizione non configurata" }, { status: 503 });
  const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", audio, `audio.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "it");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) return Response.json({ error: "Trascrizione non riuscita" }, { status: 502 });
  const json = (await res.json()) as { text?: string };
  return Response.json({ testo: (json.text ?? "").trim() });
}

function bozzaLocale(tipo: AssistenteTipo, testo: string, contesto: Record<string, unknown>): AssistenteRisposta {
  const avviso =
    "Bozza locale (assistente). Non è un atto ufficiale: rivedi e conferma prima di salvare.";
  if (tipo === "rca") {
    const dinamica = String(contesto.dinamica ?? testo ?? "");
    const grave = /deces|grave|frattur|sentinella/i.test(dinamica);
    return {
      fonte: "modello_locale",
      avviso,
      testo: "Proposta RCA da confermare. Indice calcolato come P × M × R.",
      p: grave ? 3 : 2,
      m: grave ? 3 : 2,
      r: /notturn|turno|sotto organico/i.test(dinamica) ? 3 : 2,
      fattori: "comunicazione; umano; ambiente",
    };
  }
  if (tipo === "report") {
    const nSeg = Number(contesto.segnalazioni ?? 0);
    const nSin = Number(contesto.sinistri ?? 0);
    const livello = String(contesto.livello ?? "ambito");
    const risLiq = String(contesto.risLiq ?? "—");
    return {
      fonte: "modello_locale",
      avviso,
      testo: `Sintesi ${livello}: ${nSeg} segnalazioni, ${nSin} sinistri, RIS+LIQ ${risLiq}. Cadute e identificazione restano le aree da presidiare. Nessun atto è stato scritto in archivio.`,
    };
  }
  const nucleo = testo || "evento in reparto durante l’assistenza";
  const t = testo.toLowerCase();
  const tipo_evento = /cad|scivol/.test(t) ? "caduta" : /farmac|terapia|dose/.test(t) ? "gestione_farmaco" : /identif|braccial|scambi/.test(t) ? "identificazione" : /aggress|violen/.test(t) ? "violenza_operatore" : /infezion/.test(t) ? "infezione" : "altro";
  const danno = /deces|mort|frattur|grave|trasferi/.test(t) ? "grave" : /lesion|trauma|ematoma|dolore/.test(t) ? "lieve" : "nessuno";
  return {
    fonte: "modello_locale",
    avviso,
    // Scrittura guidata (Cosa è successo: …): il testo è già una scheda, non va riformulato.
    testo: /Cosa è successo:/.test(testo)
      ? testo.replace(/(Cosa è successo|Quando|Dove|A chi|Come è andata a finire): /g, "").replace(/
/g, " ")
      : `Durante il turno, ${nucleo.replace(/^durante\s+/i, "")}. Dinamica da confermare in scheda (orario, testimoni, esito).`,
    scheda: { tipo_evento, danno, fase_cura: "assistenza", sentinella: false, tipo_sentinella: null },
  };
}

async function conModello(
  key: string,
  tipo: AssistenteTipo,
  testo: string,
  immagini: { mime: string; data: string }[],
  contesto: Record<string, unknown>,
): Promise<AssistenteRisposta> {
  const system =
    "Sei l'assistente della piattaforma Rischio clinico. Proponi solo bozze in italiano. Non inventare dati identificativi del paziente. Non salvare nulla: l'operatore conferma. Rispondi solo JSON.";
  const elenchi = (contesto.elenchi ?? {}) as Record<string, { codice: string | number; etichetta: string }[]>;
  const voci = (nome: string) => (elenchi[nome] ?? []).map((v) => `${v.codice}=${v.etichetta}`).join(", ");
  const userText =
    tipo === "segnalazione"
      ? `Materiale raccolto dall'operatore (trascrizione vocale, appunti, foto o fotogrammi di video): ${testo || "(solo immagini)"}.
Compila una scheda di incident reporting. Rispondi JSON:
{ "testo": dinamica in italiano, 3-5 frasi, fatti osservati, nessun nome di paziente,
  "tipo_evento": uno tra [${voci("tipi")}],
  "danno": "nessuno" | "lieve" | "grave",
  "fase_cura": uno tra [${voci("fasi")}],
  "luogo": uno tra [${voci("luoghi")}],
  "sentinella": true solo se rientra negli eventi sentinella del Ministero,
  "tipo_sentinella": numero dell'evento sentinella o null — elenco: ${voci("sentinelle")},
  "data_ora": data e ora dell'evento in ISO 8601 se il racconto dice quando (es. "stanotte alle tre", "ieri pomeriggio"), calcolata rispetto ad adesso = ${String(contesto.adesso ?? "")}; altrimenti null }
Traduci il linguaggio di reparto nei codici: "è scivolato, è caduto, trovato a terra" = caduta; "terapia sbagliata, doppia dose, farmaco sbagliato, dimenticato" = gestione_farmaco; "braccialetto, paziente sbagliato, scambio, lato sbagliato" = identificazione; "aggressione, spinta, insulti, minacce" = violenza_operatore se verso il personale, violenza_paziente se verso un paziente; "piaga, lesione da pressione" = decubito; "se n'è andato, non si trova, fuggito" = allontanamento; "monitor rotto, pompa guasta, apparecchio" = apparecchiature; "referto in ritardo, diagnosi sbagliata" = diagnosi; "infezione, febbre dopo intervento" = infezione. Il danno: "sta bene, niente" = nessuno; "ematoma, dolore, medicato" = lieve; "frattura, trasferito, ricoverato, deceduto" = grave.`
      : tipo === "rca"
        ? `Dinamica: ${contesto.dinamica ?? testo}. Impatto: ${contesto.impatto ?? ""}. JSON { "testo": string, "p": 1|2|3, "m": 1|2|3, "r": 1|2|3, "fattori": string }`
        : `Livello ${contesto.livello}. Segnalazioni ${contesto.segnalazioni}, sinistri ${contesto.sinistri}, RIS+LIQ ${contesto.risLiq}. JSON { "testo": string }`;

  const content: unknown[] = [{ type: "text", text: userText }];
  for (const img of immagini.slice(0, 2)) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${img.mime};base64,${img.data}` },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });
  if (!res.ok) throw new Error("modello");
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}") as AssistenteRisposta & SchedaProposta;
  const valido = (nome: string, v: unknown) => {
    const lista = elenchi[nome];
    return !lista || lista.some((x) => String(x.codice) === String(v)) ? (v as string) : undefined;
  };
  const scheda: SchedaProposta | undefined =
    tipo === "segnalazione"
      ? {
          tipo_evento: valido("tipi", parsed.tipo_evento),
          danno: parsed.danno === "lieve" || parsed.danno === "grave" ? parsed.danno : "nessuno",
          fase_cura: valido("fasi", parsed.fase_cura),
          luogo: valido("luoghi", parsed.luogo),
          sentinella: Boolean(parsed.sentinella),
          tipo_sentinella: parsed.sentinella && valido("sentinelle", parsed.tipo_sentinella) ? Number(parsed.tipo_sentinella) : null,
          data_ora: parsed.data_ora && !Number.isNaN(Date.parse(String(parsed.data_ora))) ? String(parsed.data_ora) : null,
        }
      : undefined;
  const scala = (n: unknown, fallback: number) => {
    const v = Number(n);
    return v === 1 || v === 2 || v === 3 ? v : fallback;
  };
  return {
    fonte: "modello",
    avviso: "Bozza dell’assistente. Non è un atto ufficiale: rivedi e conferma prima di salvare.",
    testo: String(parsed.testo || "").trim() || bozzaLocale(tipo, testo, contesto).testo,
    scheda,
    p: tipo === "rca" ? scala(parsed.p, 2) : undefined,
    m: tipo === "rca" ? scala(parsed.m, 2) : undefined,
    r: tipo === "rca" ? scala(parsed.r, 2) : undefined,
    fattori: tipo === "rca" ? String(parsed.fattori || "comunicazione; umano") : undefined,
  };
}
