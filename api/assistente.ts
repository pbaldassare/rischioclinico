export type AssistenteTipo = "segnalazione" | "rca" | "report";

export interface AssistenteRichiesta {
  tipo: AssistenteTipo;
  testo?: string;
  immagini?: { mime: string; data: string }[];
  contesto?: Record<string, unknown>;
}

export interface AssistenteRisposta {
  fonte: "modello" | "modello_locale";
  avviso: string;
  testo: string;
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
  const nucleo = testo || "evento in pronto soccorso durante l’assistenza";
  return {
    fonte: "modello_locale",
    avviso,
    testo: `Durante il turno, ${nucleo.replace(/^durante\s+/i, "")}. Paziente identificato, luogo pronto soccorso. Dinamica da confermare in scheda (orario, testimoni, esito).`,
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
  const userText =
    tipo === "segnalazione"
      ? `Trascrizione/foto: ${testo || "(solo immagini)"}. Proponi una dinamica breve per una scheda di incident reporting. JSON { "testo": string }`
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
  const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}") as AssistenteRisposta;
  const scala = (n: unknown, fallback: number) => {
    const v = Number(n);
    return v === 1 || v === 2 || v === 3 ? v : fallback;
  };
  return {
    fonte: "modello",
    avviso: "Bozza dell’assistente. Non è un atto ufficiale: rivedi e conferma prima di salvare.",
    testo: String(parsed.testo || "").trim() || bozzaLocale(tipo, testo, contesto).testo,
    p: tipo === "rca" ? scala(parsed.p, 2) : undefined,
    m: tipo === "rca" ? scala(parsed.m, 2) : undefined,
    r: tipo === "rca" ? scala(parsed.r, 2) : undefined,
    fattori: tipo === "rca" ? String(parsed.fattori || "comunicazione; umano") : undefined,
  };
}
