import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchPratiche } from "@/lib/queries";
import { formatData, formatEuro } from "@/lib/format";
import { ETICHETTE_SOCCOMBENZA, ETICHETTE_STATO_PRATICA } from "@/lib/labels";
import { StatoBadge } from "@/components/StatoBadge";
import { Caricamento, Vuoto } from "@/mobile/atoms";

export function BoLegale() {
  const q = useQuery({ queryKey: ["pratiche"], queryFn: fetchPratiche });
  if (q.isLoading) return <Caricamento />;
  const lista = q.data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Consultazione delle cause collegate ai sinistri. Aggiornamento automatico importi e stati arriva nel secondo
        rilascio.
      </p>
      {lista.length === 0 ? (
        <Vuoto titolo="Nessuna pratica" testo="Non ci sono cause in archivio." />
      ) : (
        <Card>
          <CardContent className="p-0 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pratica</TableHead>
                  <TableHead>Sinistro</TableHead>
                  <TableHead>Foro</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Soccombenza</TableHead>
                  <TableHead>Preteso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link className="font-semibold text-primary" to={`/bo/legale/${p.id}`}>
                        {p.numero_pratica ?? p.id.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatData(p.data_iscrizione)}</p>
                    </TableCell>
                    <TableCell>
                      {p.sinistro_id ? (
                        <Link className="text-primary" to={`/bo/sinistri/${p.sinistro_id}`}>
                          {p.sinistro?.codice_interno ?? "Sinistro"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{p.foro ?? "—"}</TableCell>
                    <TableCell>
                      <StatoBadge stato={p.stato} mappa={ETICHETTE_STATO_PRATICA} />
                    </TableCell>
                    <TableCell>{ETICHETTE_SOCCOMBENZA[p.rischio_soccombenza_codice ?? ""] ?? "—"}</TableCell>
                    <TableCell>{formatEuro(p.importo_preteso)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
