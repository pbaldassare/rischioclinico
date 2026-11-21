import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSegnalazione } from "@/lib/queries";
import { FascicoloSegnalazione } from "@/components/FascicoloSegnalazione";
import { Caricamento, Vuoto } from "@/mobile/atoms";

export function BoSegnalazioneDettaglio() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["segnalazione", id],
    queryFn: () => fetchSegnalazione(id!),
    enabled: !!id,
  });
  if (q.isLoading) return <Caricamento />;
  if (!q.data) return <Vuoto titolo="Non trovata" testo="Segnalazione assente." />;
  return <FascicoloSegnalazione segnalazione={q.data} />;
}
