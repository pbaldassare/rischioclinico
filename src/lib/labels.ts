import type { Ruolo } from "./types";

export const ETICHETTE_RUOLO: Record<Ruolo, string> = {
  admin: "Amministrazione",
  presidio: "ASL / presidio",
  operatore: "Operatore",
};

export const ETICHETTE_STATO_SEGNALAZIONE: Record<string, string> = {
  inviata: "Inviata",
  in_lavorazione: "In lavorazione",
  completata: "Completata",
};

export const ETICHETTE_STATO_SINISTRO: Record<string, string> = {
  aperto: "Aperto",
  in_riserva: "In riserva",
  liquidato: "Liquidato",
  in_causa: "In causa",
  chiuso_senza_seguito: "Chiuso senza seguito",
};

export const ETICHETTE_STATO_AZIONE: Record<string, string> = {
  aperta: "Aperta",
  in_corso: "In corso",
  fatta: "Fatta",
  verificata: "Verificata",
};

export const ETICHETTE_P = {
  1: "Bassa",
  2: "Media",
  3: "Alta",
} as const;

export const ETICHETTE_M = {
  1: "Lieve",
  2: "Significativa",
  3: "Grave",
} as const;

export const ETICHETTE_R = {
  1: "Facilmente rilevabile",
  2: "Moderatamente rilevabile",
  3: "Difficilmente rilevabile",
} as const;

export const ETICHETTE_STATO_PRATICA: Record<string, string> = {
  aperta: "Aperta",
  primo_grado: "Primo grado",
  appello: "Appello",
  chiusa: "Chiusa",
};

export const ETICHETTE_SOCCOMBENZA: Record<string, string> = {
  basso: "Basso",
  medio: "Medio",
  alto: "Alto",
};

export function etichetta(mappa: Record<string, string>, codice?: string | null) {
  if (!codice) return "—";
  return mappa[codice] ?? codice.replaceAll("_", " ");
}

export function usaPwa(ruolo: Ruolo) {
  return ruolo === "operatore";
}
