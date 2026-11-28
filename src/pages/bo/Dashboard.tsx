import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Landmark, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchEventiSentinella, fetchSegnalazioni, fetchSinistri } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { formatEuro, sommaMovimenti } from "@/lib/format";
import { StatoBadge } from "@/components/StatoBadge";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function BoDashboard() {
  const { profilo } = useAuth();
  const filtri = filtriPerProfilo(profilo);
  const seg = useQuery({ queryKey: ["segnalazioni", filtri], queryFn: () => fetchSegnalazioni(filtri) });
  const sin = useQuery({ queryKey: ["sinistri", filtri], queryFn: () => fetchSinistri(filtri) });
  const es = useQuery({ queryKey: ["sentinella", filtri], queryFn: () => fetchEventiSentinella(filtri) });

  const lista = seg.data ?? [];
  const statoAnonima = [
    { stato: "Inviata", nominative: lista.filter((s) => s.stato === "inviata" && !s.anonima).length, anonime: lista.filter((s) => s.stato === "inviata" && s.anonima).length },
    { stato: "In lavorazione", nominative: lista.filter((s) => s.stato === "in_lavorazione" && !s.anonima).length, anonime: lista.filter((s) => s.stato === "in_lavorazione" && s.anonima).length },
    { stato: "Completata", nominative: lista.filter((s) => s.stato === "completata" && !s.anonima).length, anonime: lista.filter((s) => s.stato === "completata" && s.anonima).length },
  ];
  const risLiq = (sin.data ?? []).reduce(
    (acc, s) => acc + sommaMovimenti(s.movimenti, ["riservato", "liquidato"]),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="griglia-kpi grid gap-4 md:grid-cols-3">
        <KpiCard icon={ClipboardList} titolo="Segnalazioni" valore={lista.length} nota={`${lista.filter((s) => s.stato === "inviata").length} da prendere`} />
        <KpiCard icon={Landmark} titolo="Sinistri RIS+LIQ" valore={formatEuro(risLiq)} tinta="text-accent" />
        <KpiCard icon={ShieldAlert} titolo="Eventi sentinella" valore={es.data?.length ?? 0} tinta="text-destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Stato × segnalazione anonima</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statoAnonima}>
                <XAxis dataKey="stato" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="nominative" name="Nominative" fill="hsl(206 85% 43%)" radius={8} />
                <Bar dataKey="anonime" name="Anonime" fill="hsl(206 85% 30%)" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">I tre moduli</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Modulo to="/bo/segnalazioni" titolo="Segnalazioni" testo="Coda, RCA, azioni" />
            <Modulo to="/bo/sinistri" titolo="Sinistri" testo="Denunce e importi" />
            <Modulo to="/bo/legale" titolo="Pratiche legali" testo="Cause collegate ai sinistri" />
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
                <TableHead>Stato</TableHead>
                <TableHead>Anonima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.slice(0, 6).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link className="font-semibold text-primary" to={`/bo/segnalazioni/${s.id}`}>
                      {s.dinamica}
                    </Link>
                  </TableCell>
                  <TableCell>{s.presidio?.nome}</TableCell>
                  <TableCell>
                    <StatoBadge stato={s.stato} />
                  </TableCell>
                  <TableCell>{s.anonima ? "Sì" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Modulo({ to, titolo, testo }: { to: string; titolo: string; testo: string }) {
  return (
    <Link to={to} className="rounded-[19px] border border-border bg-card p-4 shadow-card transition-all hover:shadow-lg">
      <p className="font-display font-bold">{titolo}</p>
      <p className="text-sm text-muted-foreground">{testo}</p>
    </Link>
  );
}
