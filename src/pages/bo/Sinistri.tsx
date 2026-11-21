import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { StatoBadge } from "@/components/StatoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchSinistri } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { ETICHETTE_STATO_SINISTRO } from "@/lib/labels";
import { formatData, formatEuro, sommaMovimenti } from "@/lib/format";
import type { FiltriAmbito as Filtri } from "@/lib/types";

export function BoSinistri() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const q = useQuery({ queryKey: ["sinistri", filtri], queryFn: () => fetchSinistri(filtri) });
  const lista = useMemo(() => q.data ?? [], [q.data]);

  return (
    <div className="space-y-4">
      <FiltriAmbito value={filtri} onChange={setFiltri} mostraAzienda={profilo?.ruolo === "admin"} />
      <Card>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Presidio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Richiesto</TableHead>
                <TableHead>Riservato</TableHead>
                <TableHead>Liquidato</TableHead>
                <TableHead>Franchigia</TableHead>
                <TableHead>Sentinella</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link className="font-semibold text-primary" to={`/bo/sinistri/${s.id}`}>
                      {s.codice_interno ?? s.id.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatData(s.data_evento)}</p>
                  </TableCell>
                  <TableCell>{s.presidio?.nome}</TableCell>
                  <TableCell>{cat.etichetta("tipo_sinistro", s.tipo_sinistro_codice)}</TableCell>
                  <TableCell>
                    <StatoBadge stato={s.stato} mappa={ETICHETTE_STATO_SINISTRO} />
                  </TableCell>
                  <TableCell>{formatEuro(sommaMovimenti(s.movimenti, ["richiesto"]))}</TableCell>
                  <TableCell>{formatEuro(sommaMovimenti(s.movimenti, ["riservato"]))}</TableCell>
                  <TableCell>{formatEuro(sommaMovimenti(s.movimenti, ["liquidato"]))}</TableCell>
                  <TableCell>{formatEuro(sommaMovimenti(s.movimenti, ["franchigia"]))}</TableCell>
                  <TableCell>{s.sentinella ? "Sì" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
