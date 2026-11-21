import type { FiltriAmbito, Profile } from "./types";

export function filtriPerProfilo(profilo: Profile | null): FiltriAmbito {
  if (!profilo) return {};
  if (profilo.ruolo === "regione") return {};
  if (profilo.ruolo === "operatore") {
    return { aziendaId: profilo.azienda_id, presidioId: profilo.presidio_id };
  }
  return { aziendaId: profilo.azienda_id };
}
