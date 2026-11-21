import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPratica } from "@/lib/queries";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatoBadge } from "@/components/StatoBadge";
import { ETICHETTE_SOCCOMBENZA, ETICHETTE_STATO_PRATICA } from "@/lib/labels";
import { formatData, formatEuro } from "@/lib/format";

export function BoLegaleDettaglio() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["pratica", id], queryFn: () => fetchPratica(id!), enabled: !!id });
  if (q.isLoading) return <Caricamento />;
  if (!q.data) return <Vuoto titolo="Non trovata" testo="Pratica assente." />;
  const p = q.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {p.numero_pratica}
            <StatoBadge stato={p.stato} mappa={ETICHETTE_STATO_PRATICA} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Foro: </span>
            {p.foro ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Iscrizione: </span>
            {formatData(p.data_iscrizione)}
          </p>
          <p>
            <span className="text-muted-foreground">Rischio soccombenza: </span>
            {ETICHETTE_SOCCOMBENZA[p.rischio_soccombenza_codice ?? ""] ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Prossima scadenza: </span>
            {formatData(p.prossima_scadenza)}
          </p>
          <p>
            <span className="text-muted-foreground">Importo preteso: </span>
            {formatEuro(p.importo_preteso)}
          </p>
          <p>
            <span className="text-muted-foreground">Transatto: </span>
            {formatEuro(p.importo_transatto)}
          </p>
          <p>
            <span className="text-muted-foreground">Liquidato: </span>
            {formatEuro(p.importo_liquidato)}
          </p>
          <p>
            <Link className="font-semibold text-primary" to={`/bo/sinistri/${p.sinistro_id}`}>
              Apri sinistro {p.sinistro?.codice_interno ?? ""}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
