import type { Privilegio, Profile, Ruolo } from "./types";


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

/** L'operatore può segnalare se è collegato ad almeno un reparto; ASL e Admin sempre. */
export function haPrivilegio(p: Profile | null | undefined, _privilegio: Privilegio = "segnalare") {
  if (!p?.attivo) return false;
  if (p.ruolo === "admin" || p.ruolo === "presidio") return true;
  return (p.assegnazioni ?? []).length > 0;
}

export function puoLavorareSegnalazione(p?: Profile | null) {
  return Boolean(p?.attivo) && (p?.ruolo === "admin" || p?.ruolo === "presidio");
}

export function puoGestireSinistri(p?: Profile | null) {
  return eAdmin(p) || ePresidio(p);
}

export function unitaAssegnate(p?: Profile | null) {
  return (p?.assegnazioni ?? []).map((a) => a.unita_operativa_id);
}
