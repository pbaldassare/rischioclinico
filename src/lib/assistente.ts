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

export async function proponiAssistente(body: AssistenteRichiesta): Promise<AssistenteRisposta> {
  const res = await fetch("/api/assistente", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Assistente non disponibile");
  return (await res.json()) as AssistenteRisposta;
}

export async function trascrivi(audio: Blob): Promise<string> {
  const res = await fetch("/api/trascrivi", { method: "POST", headers: { "content-type": audio.type }, body: audio });
  const json = (await res.json().catch(() => ({}))) as { testo?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Trascrizione non disponibile");
  return json.testo ?? "";
}

export function fileInBase64(file: File): Promise<{ mime: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lettura file"));
    reader.onload = () => {
      const raw = String(reader.result || "");
      const data = raw.includes(",") ? raw.split(",")[1] : raw;
      resolve({ mime: file.type || "image/jpeg", data });
    };
    reader.readAsDataURL(file);
  });
}
