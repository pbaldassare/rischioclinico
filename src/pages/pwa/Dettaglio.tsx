import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSegnalazione, rcaDi } from "@/lib/queries";
import { Intestazione } from "@/mobile/Intestazione";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { FascicoloSegnalazione } from "@/components/FascicoloSegnalazione";
import { StatoBadge } from "@/components/StatoBadge";
import { useCatalog } from "@/lib/catalog";

export function PwaDettaglio() {
  const { id } = useParams();
  const cat = useCatalog();
  const q = useQuery({
    queryKey: ["segnalazione", id],
    queryFn: () => fetchSegnalazione(id!),
    enabled: !!id,
  });

  if (q.isLoading) return <Caricamento />;
  if (!q.data) return <Vuoto titolo="Non trovata" testo="La segnalazione non esiste o non è visibile." />;

  const rca = rcaDi(q.data);

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione
        titolo={cat.etichetta("tipo_evento_ir", q.data.tipo_evento_codice)}
        sottotitolo={
          <span className="inline-flex items-center gap-2">
            <StatoBadge stato={q.data.stato} />
            {rca ? <span>P×M×R = {rca.indice_rischio}</span> : "RCA non ancora eseguita"}
          </span>
        }
        indietro
      />
      <FascicoloSegnalazione segnalazione={q.data} compatto />
    </div>
  );
}
