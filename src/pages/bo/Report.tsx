import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiltriAmbito } from "@/components/FiltriAmbito";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/KpiCard";
import { creaReport, eliminaReport, fetchReport, fetchReportSingolo, fetchSegnalazioni, fetchSinistri } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatData, formatEuro, sommaMovimenti } from "@/lib/format";
import type { FiltriAmbito as Filtri, ReportDati, ReportSalvato } from "@/lib/types";
import { BarChart3, Landmark, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Elenco dei report salvati. */
export function BoReport() {
  const { profilo } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["report"], queryFn: fetchReport });
  const elimina = useMutation({
    mutationFn: (id: string) => eliminaReport(id),
    onSuccess: () => {
      toast.success("Report eliminato");
      void qc.invalidateQueries({ queryKey: ["report"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const puoCreare = profilo?.ruolo === "admin" || profilo?.ruolo === "presidio";
  const lista = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">Un report fotografa i numeri di un ambito in una data. Salvato, resta qui e si esporta in PDF.</p>
        {puoCreare ? (
          <Button asChild size="sm" className="shrink-0">
            <Link to="/bo/report/nuovo">
              <Plus className="h-4 w-4" />
              Nuovo report
            </Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardContent className="p-0">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nessun report salvato. Crea il primo con "Nuovo report".</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Ambito</TableHead>
                  <TableHead>Creato</TableHead>
                  <TableHead>Segnalazioni</TableHead>
                  <TableHead>Sinistri</TableHead>
                  <TableHead>RIS+LIQ</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link to={`/bo/report/${r.id}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                        {r.titolo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.dati.ambito}</TableCell>
                    <TableCell>{formatData(r.created_at, true)}</TableCell>
                    <TableCell>{r.dati.segnalazioni}</TableCell>
                    <TableCell>{r.dati.sinistri}</TableCell>
                    <TableCell>{formatEuro(r.dati.risLiq)}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        aria-label={`Elimina ${r.titolo}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Eliminare il report "${r.titolo}"?`)) elimina.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Nuovo report: scegli l'ambito, guarda i numeri, dai un titolo e salva. */
export function BoReportNuovo() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filtri, setFiltri] = useState<Filtri>(() => filtriPerProfilo(profilo));
  const [titolo, setTitolo] = useState("");
  const seg = useQuery({ queryKey: ["segnalazioni", filtri], queryFn: () => fetchSegnalazioni(filtri) });
  const sin = useQuery({ queryKey: ["sinistri", filtri], queryFn: () => fetchSinistri(filtri) });

  const dati = useMemo<ReportDati>(() => {
    const livello = filtri.unitaId ? "Reparto" : filtri.presidioId ? "Ospedale" : filtri.aziendaId ? "ASL" : "Tutte le ASL";
    const ambito = [
      filtri.aziendaId ? cat.nomeAzienda(filtri.aziendaId) : "Tutte le ASL",
      filtri.presidioId ? cat.nomePresidio(filtri.presidioId) : "Tutti gli ospedali",
      filtri.unitaId ? cat.nomeUnita(filtri.unitaId) : "Tutti i reparti",
      filtri.anno ? `Anno ${filtri.anno}` : "Tutti gli anni",
    ].join(" · ");
    const sinistri = sin.data ?? [];
    const map = new Map<string, { nome: string; n: number; importo: number }>();
    for (const s of sinistri) {
      const id = s.presidio_id ?? "nd";
      const cur = map.get(id) ?? { nome: s.presidio?.nome ?? cat.nomePresidio(s.presidio_id), n: 0, importo: 0 };
      cur.n += 1;
      cur.importo += sommaMovimenti(s.movimenti, ["riservato", "liquidato"]);
      map.set(id, cur);
    }
    const k = (v: unknown) => `${Math.round(Number(v) / 1000)}k`;
    const perFascia = cat.fasce.map((f) => ({
      fascia: f.etichetta,
      // Etichetta corta per l'asse: quella completa resta nel tooltip.
      breve: f.a_euro == null ? `> ${k(f.da_euro)}` : Number(f.da_euro) === 0 ? `fino a ${k(f.a_euro)}` : `${k(f.da_euro)}–${k(f.a_euro)}`,
      n: sinistri.filter((s) => {
        const v = sommaMovimenti(s.movimenti, ["riservato", "liquidato"]);
        return v >= Number(f.da_euro) && (f.a_euro == null || v <= Number(f.a_euro));
      }).length,
    }));
    return {
      livello,
      ambito,
      segnalazioni: seg.data?.length ?? 0,
      sinistri: sinistri.length,
      risLiq: sinistri.reduce((a, s) => a + sommaMovimenti(s.movimenti, ["riservato", "liquidato"]), 0),
      perPresidio: [...map.values()],
      perFascia,
    };
  }, [filtri, seg.data, sin.data, cat]);

  const titoloProposto = `Report ${dati.livello} · ${new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}`;
  const salva = useMutation({
    mutationFn: () =>
      creaReport({
        azienda_id: filtri.aziendaId ?? profilo?.azienda_id ?? null,
        titolo: titolo.trim() || titoloProposto,
        ambito: filtri,
        dati,
        creato_da: profilo?.id ?? null,
      }),
    onSuccess: (r) => {
      toast.success("Report salvato");
      void qc.invalidateQueries({ queryKey: ["report"] });
      navigate(`/bo/report/${r.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pronto = !seg.isLoading && !sin.isLoading;

  return (
    <div className="space-y-4">
      <FiltriAmbito value={filtri} onChange={setFiltri} mostraAzienda={profilo?.ruolo === "admin"} />
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[260px] flex-1 space-y-2">
            <Label htmlFor="titolo">Titolo del report</Label>
            <Input id="titolo" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder={titoloProposto} />
          </div>
          <Button onClick={() => salva.mutate()} disabled={!pronto || salva.isPending}>
            {salva.isPending ? "Salvo…" : "Salva report"}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/bo/report">Annulla</Link>
          </Button>
        </CardContent>
      </Card>
      <VistaReport dati={dati} />
    </div>
  );
}

/** Report salvato: i numeri di allora, con esportazione PDF. */
export function BoReportSalvato() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["report", id], queryFn: () => fetchReportSingolo(id!), enabled: !!id });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Carico…</p>;
  const r = q.data;
  if (!r) return <p className="text-sm text-muted-foreground">Report non trovato.</p>;
  const quando = formatData(r.created_at, true);
  return (
    <div className="space-y-4">
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{r.titolo}</h1>
        <p className="text-sm text-muted-foreground">
          {r.dati.ambito} · creato il {quando}
        </p>
      </div>
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm font-semibold">{r.titolo}</p>
          <p className="text-sm text-muted-foreground">
            {r.dati.ambito} · creato il {quando}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Esporta PDF
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/bo/report">Tutti i report</Link>
          </Button>
        </div>
      </div>
      <VistaReport dati={r.dati} />
    </div>
  );
}

function VistaReport({ dati }: { dati: ReportDati }) {
  return (
    <>
      <div className="griglia-kpi grid gap-4 md:grid-cols-3 print:grid-cols-3">
        <KpiCard icon={BarChart3} titolo="Segnalazioni" valore={dati.segnalazioni} />
        <KpiCard icon={Landmark} titolo="Sinistri" valore={dati.sinistri} />
        <KpiCard icon={Landmark} titolo="RIS+LIQ" valore={formatEuro(dati.risLiq)} tinta="text-accent" />
      </div>
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
              {dati.perPresidio.map((r) => (
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
          <CardTitle className="text-xl">Sinistri per fascia di importo</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dati.perFascia}>
              <XAxis dataKey="breve" tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(_, p) => String(p[0]?.payload?.fascia ?? "")} />
              <Bar dataKey="n" name="Sinistri" fill="hsl(206 85% 43%)" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

export type { ReportSalvato };
