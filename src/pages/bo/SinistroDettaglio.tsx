import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPraticaDaSinistro, fetchSinistro } from "@/lib/queries";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatoBadge } from "@/components/StatoBadge";
import { ETICHETTE_STATO_SINISTRO } from "@/lib/labels";
import { useCatalog } from "@/lib/catalog";
import { formatData, formatEuro, sommaMovimenti } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function BoSinistroDettaglio() {
  const { id } = useParams();
  const cat = useCatalog();
  const q = useQuery({ queryKey: ["sinistro", id], queryFn: () => fetchSinistro(id!), enabled: !!id });
  const pratica = useQuery({
    queryKey: ["pratica-da-sinistro", id],
    queryFn: () => fetchPraticaDaSinistro(id!),
    enabled: !!id,
  });
  if (q.isLoading) return <Caricamento />;
  if (!q.data) return <Vuoto titolo="Non trovato" testo="Sinistro assente." />;
  const s = q.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {s.codice_interno}
            <StatoBadge stato={s.stato} mappa={ETICHETTE_STATO_SINISTRO} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Presidio: </span>
            {s.presidio?.nome}
          </p>
          <p>
            <span className="text-muted-foreground">Tipo: </span>
            {cat.etichetta("tipo_sinistro", s.tipo_sinistro_codice)}
          </p>
          <p>
            <span className="text-muted-foreground">Data evento: </span>
            {formatData(s.data_evento)}
          </p>
          <p>
            <span className="text-muted-foreground">Denuncia: </span>
            {formatData(s.data_denuncia)}
          </p>
          <p>
            <span className="text-muted-foreground">Sentinella: </span>
            {s.sentinella ? "Sì" : "No"}
          </p>
          {s.segnalazione_id ? (
            <p>
              <Link className="font-semibold text-primary" to={`/bo/segnalazioni/${s.segnalazione_id}`}>
                Apri segnalazione di origine
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground">Nessuna segnalazione collegata</p>
          )}
          {pratica.data ? (
            <p>
              <Link className="font-semibold text-primary" to={`/bo/legale/${pratica.data.id}`}>
                Pratica legale {pratica.data.numero_pratica}
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Movimenti economici</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Importo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(s.movimenti ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{cat.etichetta("tipo_movimento", m.tipo)}</TableCell>
                  <TableCell>{formatEuro(m.importo)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold">Riservato + liquidato</TableCell>
                <TableCell className="font-semibold">
                  {formatEuro(sommaMovimenti(s.movimenti, ["riservato", "liquidato"]))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
