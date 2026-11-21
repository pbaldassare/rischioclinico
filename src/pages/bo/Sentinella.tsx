import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchEventiSentinella } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import { Link } from "react-router-dom";

export function BoSentinella() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const filtri = filtriPerProfilo(profilo);
  const q = useQuery({ queryKey: ["sentinella", filtri], queryFn: () => fetchEventiSentinella(filtri) });
  const conteggi = new Map<number, number>();
  for (const e of q.data ?? []) conteggi.set(e.tipo_codice, (conteggi.get(e.tipo_codice) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Protocollo Ministero 2024 — 23 tipi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Evento sentinella</TableHead>
                <TableHead>Casi in archivio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cat.tipiSentinella.map((t) => (
                <TableRow key={t.codice}>
                  <TableCell className="font-semibold">{t.codice}</TableCell>
                  <TableCell>{t.etichetta}</TableCell>
                  <TableCell>{conteggi.get(t.codice) ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Schede aperte</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Presidio</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Scheda A</TableHead>
                <TableHead>Collegamenti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {e.tipo_codice}. {cat.sentinellaEtichetta(e.tipo_codice)}
                  </TableCell>
                  <TableCell>{e.presidio?.nome}</TableCell>
                  <TableCell>{formatData(e.data_ora_evento, true)}</TableCell>
                  <TableCell>{formatData(e.scheda_a_inviata_il)}</TableCell>
                  <TableCell>
                    {e.segnalazione_id ? (
                      <Link className="text-primary" to={`/bo/segnalazioni/${e.segnalazione_id}`}>
                        Segnalazione
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
