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

export async function proponiAssistente(body: AssistenteRichiesta): Promise<AssistenteRisposta> {
  const res = await fetch("/api/assistente", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Assistente non disponibile");
  return (await res.json()) as AssistenteRisposta;
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
