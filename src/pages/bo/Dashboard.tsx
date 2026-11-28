import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Landmark, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchEventiSentinella,
  fetchSegnalazioni,
  fetchSinistri,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { filtriPerProfilo } from "@/lib/ambito";
import { formatEuro, sommaMovimenti } from "@/lib/format";
import { formatData } from "@/lib/format";

export function BoDashboard() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const filtri = filtriPerProfilo(profilo);
  const seg = useQuery({
    queryKey: ["segnalazioni", filtri],
    queryFn: () => fetchSegnalazioni(filtri),
  });
  const sin = useQuery({
    queryKey: ["sinistri", filtri],
    queryFn: () => fetchSinistri(filtri),
  });
  const es = useQuery({
    queryKey: ["sentinella", filtri],
    queryFn: () => fetchEventiSentinella(filtri),
  });

  const lista = seg.data ?? [];
  const risLiq = (sin.data ?? []).reduce(
    (acc, s) => acc + sommaMovimenti(s.movimenti, ["riservato", "liquidato"]),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="griglia-kpi grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={ClipboardList}
          titolo="Segnalazioni"
          valore={lista.length}
        />
        <KpiCard
          icon={Landmark}
          titolo="Sinistri RIS+LIQ"
          valore={formatEuro(risLiq)}
          tinta="text-accent"
        />
        <KpiCard
          icon={ShieldAlert}
          titolo="Eventi sentinella"
          valore={es.data?.length ?? 0}
          tinta="text-destructive"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">I tre moduli</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Modulo
              to="/bo/segnalazioni"
              titolo="Segnalazioni"
              testo="Eventi, analisi delle cause, azioni"
            />
            <Modulo
              to="/bo/sinistri"
              titolo="Sinistri"
              testo="Denunce e importi"
            />
            <Modulo
              to="/bo/legale"
              titolo="Pratiche legali"
              testo="Cause collegate ai sinistri"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ultime segnalazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Presidio</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.slice(0, 6).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      className="font-semibold text-primary"
                      to={`/bo/segnalazioni/${s.id}`}
                    >
                      {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                    </Link>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{s.dinamica}</p>
                  </TableCell>
                  <TableCell>{s.presidio?.nome}</TableCell>
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

function Modulo({
  to,
  titolo,
  testo,
}: {
  to: string;
  titolo: string;
  testo: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-[19px] border border-border bg-card p-4 shadow-card transition-all hover:shadow-lg"
    >
      <p className="font-display font-bold">{titolo}</p>
      <p className="text-sm text-muted-foreground">{testo}</p>
    </Link>
  );
}
