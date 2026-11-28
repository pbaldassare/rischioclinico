import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/KpiCard";
import { fetchSegnalazioni, fetchSinistri } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatEuro, sommaMovimenti } from "@/lib/format";
import type { FiltriAmbito as Filtri } from "@/lib/types";
import { BarChart3, Landmark, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AssistenteBozza } from "@/components/AssistenteBozza";

export function BoReport() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const seg = useQuery({
    queryKey: ["segnalazioni", filtri],
    queryFn: () => fetchSegnalazioni(filtri),
  });
  const sin = useQuery({
    queryKey: ["sinistri", filtri],
    queryFn: () => fetchSinistri(filtri),
  });

  const livello = filtri.unitaId
    ? "Reparto"
    : filtri.presidioId
      ? "Ospedale"
      : filtri.aziendaId
        ? "ASL"
        : "Tutte le ASL";

  const perPresidio = useMemo(() => {
    const map = new Map<string, { nome: string; n: number; importo: number }>();
    for (const s of sin.data ?? []) {
      const id = s.presidio_id ?? "nd";
      const cur = map.get(id) ?? {
        nome: s.presidio?.nome ?? cat.nomePresidio(s.presidio_id),
        n: 0,
        importo: 0,
      };
      cur.n += 1;
      cur.importo += sommaMovimenti(s.movimenti, ["riservato", "liquidato"]);
      map.set(id, cur);
    }
    return [...map.values()];
  }, [sin.data, cat]);

  const perFascia = useMemo(() => {
    return cat.fasce.map((f) => {
      const n = (sin.data ?? []).filter((s) => {
        const v = sommaMovimenti(s.movimenti, ["riservato", "liquidato"]);
        return (
          v >= Number(f.da_euro) && (f.a_euro == null || v <= Number(f.a_euro))
        );
      }).length;
      // Etichetta corta per l'asse: quella completa resta nel tooltip.
      const k = (v: unknown) => `${Math.round(Number(v) / 1000)}k`;
      const breve =
        f.a_euro == null
          ? `> ${k(f.da_euro)}`
          : Number(f.da_euro) === 0
            ? `fino a ${k(f.a_euro)}`
            : `${k(f.da_euro)}–${k(f.a_euro)}`;
      return { fascia: f.etichetta, breve, n };
    });
  }, [sin.data, cat.fasce]);
  const dataStampa = new Date().toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ambito = [
    filtri.presidioId
      ? cat.nomePresidio(filtri.presidioId)
      : "Tutti gli ospedali",
    filtri.unitaId ? cat.nomeUnita(filtri.unitaId) : "Tutti i reparti",
    filtri.anno ? `Anno ${filtri.anno}` : "Tutti gli anni",
  ].join(" · ");

  const risLiq = (sin.data ?? []).reduce(
    (a, s) => a + sommaMovimenti(s.movimenti, ["riservato", "liquidato"]),
    0,
  );
  const [sintesi, setSintesi] = useState("");

  return (
    <div className="space-y-4">
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Report per livello · {livello}</h1>
        <p className="text-sm text-muted-foreground">
          {ambito} · stampato il {dataStampa}
        </p>
      </div>
      <div className="flex items-start justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Stessi indicatori, ambito diverso. Livello attuale:{" "}
          <strong>{livello}</strong>.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Esporta PDF
        </Button>
      </div>
      <div className="print:hidden">
        <FiltriAmbito
          value={filtri}
          onChange={setFiltri}
          mostraAzienda={profilo?.ruolo === "admin"}
        />
      </div>
      <div className="griglia-kpi grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={BarChart3}
          titolo="Segnalazioni"
          valore={seg.data?.length ?? 0}
        />
        <KpiCard
          icon={Landmark}
          titolo="Sinistri"
          valore={sin.data?.length ?? 0}
        />
        <KpiCard
          icon={Landmark}
          titolo="RIS+LIQ"
          valore={formatEuro(risLiq)}
          tinta="text-accent"
        />
      </div>
      <div className="print:hidden">
        <AssistenteBozza
          tipo="report"
          contesto={{
            livello,
            segnalazioni: seg.data?.length ?? 0,
            sinistri: sin.data?.length ?? 0,
            risLiq: formatEuro(risLiq),
          }}
          onUsa={(b) => setSintesi(b.testo)}
        />
      </div>
      {sintesi ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sintesi assistente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{sintesi}</p>
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              Solo consultazione: non è stata scritta in archivio.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sinistri per presidio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Presidio</TableHead>
                <TableHead>N.</TableHead>
                <TableHead>Importo RIS+LIQ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perPresidio.map((r) => (
                <TableRow key={r.nome}>
                  <TableCell>{r.nome}</TableCell>
                  <TableCell>{r.n}</TableCell>
                  <TableCell>{formatEuro(r.importo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Sinistri per fascia di importo
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perFascia}>
              <XAxis dataKey="breve" tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(_, p) => String(p[0]?.payload?.fascia ?? "")}
              />
              <Bar
                dataKey="n"
                name="Sinistri"
                fill="hsl(190 75% 33%)"
                radius={8}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
