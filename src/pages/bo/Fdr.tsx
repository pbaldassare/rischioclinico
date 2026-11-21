import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { pillFdr } from "@/components/StatoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchFotografie } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { formatData } from "@/lib/format";
import type { FiltriAmbito as Filtri } from "@/lib/types";

export function BoFdr() {
  const { profilo } = useAuth();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const q = useQuery({ queryKey: ["fdr", filtri], queryFn: () => fetchFotografie(filtri) });

  return (
    <div className="space-y-4">
      <FiltriAmbito value={filtri} onChange={setFiltri} mostraAzienda={profilo?.ruolo === "admin"} />
      <Card>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Checklist</TableHead>
                <TableHead>Presidio / reparto</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link className="font-semibold text-primary" to={`/bo/fdr/${f.id}`}>
                      {f.modello?.nome ?? "Fotografia"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {f.presidio?.nome}
                    <p className="text-xs text-muted-foreground">{f.unita?.nome}</p>
                  </TableCell>
                  <TableCell>
                    {formatData(f.periodo_dal)} – {formatData(f.periodo_al)}
                  </TableCell>
                  <TableCell>{pillFdr(f.stato)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
