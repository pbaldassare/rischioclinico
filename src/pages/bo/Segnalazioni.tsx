import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchSegnalazioni } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import type { FiltriAmbito as Filtri } from "@/lib/types";

export function BoSegnalazioni() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const q = useQuery({
    queryKey: ["segnalazioni", filtri],
    queryFn: () => fetchSegnalazioni(filtri),
  });
  const lista = q.data ?? [];

  return (
    <div className="space-y-4">
      <FiltriAmbito
        value={filtri}
        onChange={setFiltri}
        mostraAzienda={profilo?.ruolo === "admin"}
      />
      <Card>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Presidio / reparto</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      className="font-semibold text-primary"
                      to={`/bo/segnalazioni/${s.id}`}
                    >
                      {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {s.dinamica}
                    </p>
                  </TableCell>
                  <TableCell>
                    {s.presidio?.nome}
                    <p className="text-xs text-muted-foreground">
                      {s.unita?.nome}
                    </p>
                  </TableCell>
                  <TableCell>{formatData(s.data_ora_evento, true)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
