import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAziende,
  fetchClassificazioni,
  fetchFasce,
  fetchPresidi,
  fetchTipiSentinella,
  fetchUnita,
} from "./queries";
import type { Azienda, Classificazione, FasciaImporto, Presidio, TipoSentinella, UnitaOperativa } from "./types";

interface Catalog {
  aziende: Azienda[];
  presidi: Presidio[];
  unita: UnitaOperativa[];
  classificazioni: Classificazione[];
  tipiSentinella: TipoSentinella[];
  fasce: FasciaImporto[];
  elenco: (tipo: string) => Classificazione[];
  etichetta: (tipo: string, codice?: string | null) => string;
  nomePresidio: (id?: string | null) => string;
  nomeUnita: (id?: string | null) => string;
  nomeAzienda: (id?: string | null) => string;
  sentinellaEtichetta: (codice?: number | null) => string;
}

const Ctx = createContext<Catalog | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const aziende = useQuery({ queryKey: ["aziende"], queryFn: fetchAziende });
  const presidi = useQuery({ queryKey: ["presidi"], queryFn: fetchPresidi });
  const unita = useQuery({ queryKey: ["unita"], queryFn: fetchUnita });
  const classificazioni = useQuery({ queryKey: ["classificazioni"], queryFn: fetchClassificazioni });
  const tipiSentinella = useQuery({ queryKey: ["tipi-sentinella"], queryFn: fetchTipiSentinella });
  const fasce = useQuery({ queryKey: ["fasce"], queryFn: fetchFasce });

  const value = useMemo<Catalog>(() => {
    const classif = classificazioni.data ?? [];
    const elenco = (tipo: string) => classif.filter((c) => c.tipo_elenco === tipo);
    return {
      aziende: aziende.data ?? [],
      presidi: presidi.data ?? [],
      unita: unita.data ?? [],
      classificazioni: classif,
      tipiSentinella: tipiSentinella.data ?? [],
      fasce: fasce.data ?? [],
      elenco,
      etichetta: (tipo, codice) => elenco(tipo).find((c) => c.codice === codice)?.etichetta ?? (codice || "—"),
      nomePresidio: (id) => presidi.data?.find((p) => p.id === id)?.nome ?? "—",
      nomeUnita: (id) => unita.data?.find((u) => u.id === id)?.nome ?? "—",
      nomeAzienda: (id) => aziende.data?.find((a) => a.id === id)?.nome ?? "—",
      sentinellaEtichetta: (codice) =>
        tipiSentinella.data?.find((t) => t.codice === codice)?.etichetta ?? (codice ? `Tipo ${codice}` : "—"),
    };
  }, [aziende.data, presidi.data, unita.data, classificazioni.data, tipiSentinella.data, fasce.data]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalog fuori da CatalogProvider");
  return ctx;
}
