import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { StatoBadge } from "@/components/StatoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchSegnalazioni, rcaDi } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import type { FiltriAmbito as Filtri } from "@/lib/types";
import { Label } from "@/components/ui/label";

export function BoSegnalazioni() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const [stato, setStato] = useState("tutti");
  const [anonima, setAnonima] = useState("tutte");
  const q = useQuery({ queryKey: ["segnalazioni", filtri], queryFn: () => fetchSegnalazioni(filtri) });

  const lista = useMemo(() => {
    let rows = q.data ?? [];
    if (stato !== "tutti") rows = rows.filter((s) => s.stato === stato);
    if (anonima === "si") rows = rows.filter((s) => s.anonima);
    if (anonima === "no") rows = rows.filter((s) => !s.anonima);
    return rows;
  }, [q.data, stato, anonima]);

  return (
    <div className="space-y-4">
      <FiltriAmbito value={filtri} onChange={setFiltri} mostraAzienda={profilo?.ruolo === "regione"} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Stato</Label>
          <Select value={stato} onValueChange={setStato}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti</SelectItem>
              <SelectItem value="inviata">Inviata</SelectItem>
              <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
              <SelectItem value="completata">Completata</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Anonima</Label>
          <Select value={anonima} onValueChange={setAnonima}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutte">Tutte</SelectItem>
              <SelectItem value="si">Sì</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Presidio / reparto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Anonima</TableHead>
                <TableHead>RCA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((s) => {
                const rca = rcaDi(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link className="font-semibold text-primary" to={`/bo/segnalazioni/${s.id}`}>
                        {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{s.dinamica}</p>
                    </TableCell>
                    <TableCell>
                      {s.presidio?.nome}
                      <p className="text-xs text-muted-foreground">{s.unita?.nome}</p>
                    </TableCell>
                    <TableCell>{formatData(s.data_ora_evento, true)}</TableCell>
                    <TableCell>
                      <StatoBadge stato={s.stato} />
                    </TableCell>
                    <TableCell>{s.anonima ? "Sì" : "No"}</TableCell>
                    <TableCell>{rca?.indice_rischio ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
