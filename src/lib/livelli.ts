import type { Privilegio, Profile, Ruolo } from "./types";

export const PRIVILEGI_OPERATORE: { codice: Privilegio; etichetta: string }[] = [
  { codice: "segnalare", etichetta: "Nuova segnalazione" },
  { codice: "coda", etichetta: "Coda del reparto" },
  { codice: "fdr", etichetta: "Fotografia del rischio" },
  { codice: "lavorare", etichetta: "Presa in carico e RCA" },
];

export function eAdmin(p?: Profile | null) {
  return p?.ruolo === "admin";
}

export function ePresidio(p?: Profile | null) {
  return p?.ruolo === "presidio";
}

export function eOperatore(p?: Profile | null) {
  return p?.ruolo === "operatore";
}

export function usaPwa(ruolo: Ruolo) {
  return ruolo === "operatore";
}

export function haPrivilegio(p: Profile | null | undefined, privilegio: Privilegio) {
  if (!p?.attivo) return false;
  if (p.ruolo === "admin" || p.ruolo === "presidio") return true;
  return (p.assegnazioni ?? []).some((a) => a.privilegi.includes(privilegio));
}

export function puoLavorareSegnalazione(p?: Profile | null) {
  if (!p?.attivo) return false;
  if (p.ruolo === "admin" || p.ruolo === "presidio") return true;
  return haPrivilegio(p, "lavorare");
}

export function puoGestireSinistri(p?: Profile | null) {
  return eAdmin(p) || ePresidio(p);
}

export function unitaAssegnate(p?: Profile | null) {
  return (p?.assegnazioni ?? []).map((a) => a.unita_operativa_id);
}
