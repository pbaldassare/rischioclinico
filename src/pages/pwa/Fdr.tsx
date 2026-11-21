import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Intestazione } from "@/mobile/Intestazione";
import { Caricamento, Scheda, Vuoto } from "@/mobile/atoms";
import { fetchFotografie } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { haPrivilegio } from "@/lib/livelli";
import { formatData } from "@/lib/format";
import { pillFdr } from "@/components/StatoBadge";

export function PwaFdr() {
  const { profilo } = useAuth();
  const filtri = filtriPerProfilo(profilo);
  const q = useQuery({
    queryKey: ["fdr", filtri],
    queryFn: () => fetchFotografie(filtri),
    enabled: haPrivilegio(profilo, "fdr"),
  });

  if (!haPrivilegio(profilo, "fdr")) {
    return (
      <div className="flex flex-1 flex-col px-4 pb-4">
        <Intestazione titolo="Fotografia del rischio" sottotitolo="Privilegio non assegnato" indietro />
        <Vuoto titolo="Non abilitato" testo="L’ASL non ti ha dato il privilegio FDR." />
      </div>
    );
  }
  if (q.isLoading) return <Caricamento />;
  const lista = q.data ?? [];

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <Intestazione titolo="Fotografia del rischio" sottotitolo="Checklist del tuo reparto" indietro />
      {lista.length === 0 ? (
        <Vuoto titolo="Nessuna rilevazione" testo="Non ci sono checklist per i tuoi reparti." />
      ) : (
        <ul className="space-y-2">
          {lista.map((f) => (
            <li key={f.id}>
              <Link to={`/app/fdr/${f.id}`}>
                <Scheda>
                  <p className="font-display text-[13px] font-bold">{f.modello?.nome ?? "Fotografia"}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {f.presidio?.nome} · {f.unita?.nome} · {formatData(f.periodo_dal)}
                  </p>
                  <div className="mt-1">{pillFdr(f.stato)}</div>
                </Scheda>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
