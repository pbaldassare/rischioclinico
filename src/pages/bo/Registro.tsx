import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchSegnalazioni, fetchSinistri, rcaDi } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatEuro, sommaMovimenti } from "@/lib/format";
import type { FiltriAmbito as Filtri } from "@/lib/types";
import { cn } from "@/lib/utils";

// Indice P×M×R (1–27): i valori possibili sono 1,2,3,4,6,8,9,12,18,27.
function livello(indice: number | null) {
  if (indice == null) return { testo: "—", classe: "text-muted-foreground" };
  if (indice >= 12) return { testo: `${indice} · alto`, classe: "font-bold text-destructive" };
  if (indice >= 6) return { testo: `${indice} · medio`, classe: "font-semibold text-accent" };
  return { testo: `${indice} · basso`, classe: "text-primary" };
}

const oggi = () => new Date().toISOString().slice(0, 10);

export function BoRegistro() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const seg = useQuery({ queryKey: ["segnalazioni", filtri], queryFn: () => fetchSegnalazioni(filtri) });
  const sin = useQuery({ queryKey: ["sinistri", filtri], queryFn: () => fetchSinistri(filtri) });

  const righe = useMemo(() => {
    const reparti = cat.unita.filter((u) => {
      const p = cat.presidi.find((x) => x.id === u.presidio_id);
      return (!filtri.aziendaId || p?.azienda_id === filtri.aziendaId) && (!filtri.presidioId || u.presidio_id === filtri.presidioId) && (!filtri.unitaId || u.id === filtri.unitaId);
    });
    return reparti
      .map((u) => {
        const s = (seg.data ?? []).filter((x) => x.unita_operativa_id === u.id);
        const indici = s.map((x) => rcaDi(x)?.indice_rischio).filter((v): v is number => v != null);
        const azioni = s.flatMap((x) => x.azioni ?? []);
        const aperte = azioni.filter((a) => a.stato !== "verificata");
        const sinistri = (sin.data ?? []).filter((x) => x.unita_operativa_id === u.id);
        return {
          id: u.id,
          reparto: u.nome,
          ospedale: cat.nomePresidio(u.presidio_id),
          segnalazioni: s.length,
          nearMiss: s.filter((x) => x.gravita_codice === "near_miss").length,
          avversi: s.filter((x) => x.gravita_codice === "evento_avverso").length,
          sentinella: s.filter((x) => x.sentinella || x.gravita_codice === "evento_sentinella").length,
          indiceMax: indici.length ? Math.max(...indici) : null,
          azioniAperte: aperte.length,
          azioniScadute: aperte.filter((a) => a.scadenza && a.scadenza < oggi()).length,
          azioniEfficaci: azioni.filter((a) => a.esito_verifica === "efficace").length,
          azioniVerificate: azioni.filter((a) => a.stato === "verificata").length,
          sinistri: sinistri.length,
          costo: sinistri.reduce((acc, x) => acc + sommaMovimenti(x.movimenti, ["riservato", "liquidato"]), 0),
        };
      })
      .sort((a, b) => (b.indiceMax ?? 0) - (a.indiceMax ?? 0) || b.costo - a.costo || b.segnalazioni - a.segnalazioni);
  }, [cat, filtri, seg.data, sin.data]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Un reparto per riga, ordinati dal rischio più alto. Il rischio è l’indice P × M × R più alto tra le segnalazioni
        analizzate (basso fino a 4, medio da 6 a 9, alto da 12). Si aggiorna da solo quando cambiano analisi, azioni o
        sinistri.
      </p>
      <FiltriAmbito value={filtri} onChange={setFiltri} mostraAzienda={profilo?.ruolo === "admin"} />
      <Card>
        <CardContent className="p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reparto</TableHead>
                <TableHead>Segnalazioni</TableHead>
                <TableHead>Rischio</TableHead>
                <TableHead>Azioni aperte</TableHead>
                <TableHead>Verificate</TableHead>
                <TableHead>Sinistri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {righe.map((r) => {
                const l = livello(r.indiceMax);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-semibold">{r.reparto}</span>
                      <p className="text-xs text-muted-foreground">{r.ospedale}</p>
                    </TableCell>
                    <TableCell>
                      {r.segnalazioni}
                      <p className="text-xs text-muted-foreground">
                        {r.nearMiss} near miss · {r.avversi} avversi · {r.sentinella} sentinella
                      </p>
                    </TableCell>
                    <TableCell className={l.classe}>{l.testo}</TableCell>
                    <TableCell className={cn(r.azioniScadute > 0 && "font-semibold text-destructive")}>
                      {r.azioniAperte}
                      {r.azioniScadute ? ` (${r.azioniScadute} scadute)` : ""}
                    </TableCell>
                    <TableCell>
                      {r.azioniVerificate}
                      {r.azioniVerificate ? (
                        <p className="text-xs text-muted-foreground">{r.azioniEfficaci} efficaci</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {r.sinistri}
                      {r.sinistri ? <p className="text-xs text-muted-foreground">{formatEuro(r.costo)}</p> : null}
                    </TableCell>
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
