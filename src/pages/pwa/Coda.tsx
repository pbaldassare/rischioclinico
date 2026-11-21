import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Intestazione } from "@/mobile/Intestazione";
import { Caricamento, Scheda, Vuoto } from "@/mobile/atoms";
import { fetchSegnalazioni } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import { StatoBadge } from "@/components/StatoBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function PwaCoda() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const [filtro, setFiltro] = useState("tutte");
  const filtri = filtriPerProfilo(profilo);
  const q = useQuery({
    queryKey: ["segnalazioni", filtri],
    queryFn: () => fetchSegnalazioni(filtri),
  });

  if (q.isLoading) return <Caricamento />;
  let lista = q.data ?? [];
  if (filtro !== "tutte") lista = lista.filter((s) => s.stato === filtro);

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <Intestazione titolo="Coda segnalazioni" sottotitolo="Filtra per stato" />
      <Tabs value={filtro} onValueChange={setFiltro} className="mb-3">
        <TabsList className="w-full">
          <TabsTrigger value="tutte">Tutte</TabsTrigger>
          <TabsTrigger value="inviata">Inviate</TabsTrigger>
          <TabsTrigger value="in_lavorazione">Lavorazione</TabsTrigger>
          <TabsTrigger value="completata">Completate</TabsTrigger>
        </TabsList>
      </Tabs>
      {lista.length === 0 ? (
        <Vuoto titolo="Nessuna scheda" testo="Non ci sono segnalazioni con questo filtro." />
      ) : (
        <ul className="space-y-2">
          {lista.map((s) => (
            <li key={s.id}>
              <Link to={`/app/coda/${s.id}`}>
                <Scheda>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[13px] font-bold">
                        {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                      </p>
                      <p className="truncate text-[10.5px] text-muted-foreground">
                        {s.presidio?.nome} · {s.unita?.nome} · {formatData(s.data_ora_evento)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatoBadge stato={s.stato} />
                      {s.anonima ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">Anonima</span>
                      ) : null}
                    </div>
                  </div>
                </Scheda>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
