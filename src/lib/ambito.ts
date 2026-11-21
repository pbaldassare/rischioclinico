import { eAdmin, eOperatore } from "./livelli";
import type { FiltriAmbito, Profile } from "./types";

export function filtriPerProfilo(profilo: Profile | null): FiltriAmbito {
  if (!profilo || eAdmin(profilo)) return {};
  if (eOperatore(profilo)) {
    return {
      aziendaId: profilo.azienda_id,
      presidioId: profilo.presidio_id,
    };
  }
  return { aziendaId: profilo.azienda_id, presidioId: profilo.presidio_id };
}
