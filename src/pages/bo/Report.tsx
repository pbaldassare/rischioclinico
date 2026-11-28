import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { creaReport, eliminaReport, fetchAttivitaTutte, fetchReport, fetchReportSingolo, fetchSegnalazioni, fetchSinistri } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import { calcolaRelazione } from "@/lib/relazione";
import { DocumentoRelazione } from "@/pages/bo/Relazione";
import { Plus, Printer, Trash2 } from "lucide-react";

/** Elenco delle relazioni salvate. */
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
        <p className="text-sm text-muted-foreground">
          La relazione annuale di un’ASL: eventi avversi e risarcimenti, come prevista dalla Legge 24/2017. Salvata, resta qui e si esporta in PDF.
        </p>
        {puoCreare ? (
          <Button asChild size="sm" className="shrink-0">
            <Link to="/bo/report/nuovo">
              <Plus className="h-4 w-4" />
              Nuova relazione
            </Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardContent className="p-0">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nessuna relazione salvata. Crea la prima con "Nuova relazione".</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>ASL</TableHead>
                  <TableHead>Anno</TableHead>
                  <TableHead>Creata</TableHead>
                  <TableHead>Segnalazioni</TableHead>
                  <TableHead>Richieste</TableHead>
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
                    <TableCell className="text-muted-foreground">{r.dati.azienda}</TableCell>
                    <TableCell>{r.dati.anno}</TableCell>
                    <TableCell>{formatData(r.created_at, true)}</TableCell>
                    <TableCell>{r.dati.sintesi.segnalazioni}</TableCell>
                    <TableCell>{r.dati.sintesi.richieste}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        aria-label={`Elimina ${r.titolo}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Eliminare "${r.titolo}"?`)) elimina.mutate(r.id);
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

/** Nuova relazione: ASL e anno, anteprima del documento, titolo e salva. */
export function BoReportNuovo() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const admin = profilo?.ruolo === "admin";
  const [aziendaId, setAziendaId] = useState(profilo?.azienda_id ?? "");
  const aziendaScelta = admin ? aziendaId || cat.aziende[0]?.id || "" : (profilo?.azienda_id ?? "");
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [titolo, setTitolo] = useState("");
  const seg = useQuery({ queryKey: ["segnalazioni", { aziendaId: aziendaScelta }], queryFn: () => fetchSegnalazioni({ aziendaId: aziendaScelta }) });
  const sin = useQuery({ queryKey: ["sinistri", { aziendaId: aziendaScelta }], queryFn: () => fetchSinistri({ aziendaId: aziendaScelta }) });
  const att = useQuery({ queryKey: ["attivita"], queryFn: fetchAttivitaTutte });
  const presidi = cat.presidi.filter((p) => p.azienda_id === aziendaScelta);
  const anni = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    for (const s of seg.data ?? []) if (s.data_ora_evento) set.add(new Date(s.data_ora_evento).getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [seg.data]);
  const relazione = useMemo(
    () =>
      seg.data && sin.data
        ? calcolaRelazione({
            azienda: cat.nomeAzienda(aziendaScelta),
            anno,
            segnalazioni: seg.data,
            sinistri: sin.data,
            attivita: att.data ?? [],
            presidi,
            unita: cat.unita.filter((u) => presidi.some((p) => p.id === u.presidio_id)),
          })
        : null,
    [seg.data, sin.data, att.data, anno, aziendaScelta, cat, presidi],
  );
  const titoloProposto = `Relazione annuale ${anno} · ${cat.nomeAzienda(aziendaScelta)}`;
  const salva = useMutation({
    mutationFn: () =>
      creaReport({
        azienda_id: aziendaScelta || null,
        titolo: titolo.trim() || titoloProposto,
        ambito: { aziendaId: aziendaScelta, anno: String(anno) },
        dati: relazione!,
        creato_da: profilo?.id ?? null,
      }),
    onSuccess: (r) => {
      toast.success("Relazione salvata");
      void qc.invalidateQueries({ queryKey: ["report"] });
      navigate(`/bo/report/${r.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
          {admin ? (
            <div className="space-y-2">
              <Label>ASL</Label>
              <Select value={aziendaScelta} onValueChange={setAziendaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cat.aziende.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Anno</Label>
            <Select value={String(anno)} onValueChange={(v) => setAnno(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anni.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="titolo">Titolo</Label>
            <Input id="titolo" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder={titoloProposto} />
          </div>
          <div className="flex gap-2 md:col-span-4">
            <Button onClick={() => salva.mutate()} disabled={!relazione || salva.isPending}>
              {salva.isPending ? "Salvo…" : "Salva relazione"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/bo/report">Annulla</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      {relazione ? <DocumentoRelazione r={relazione} /> : <p className="text-sm text-muted-foreground">Calcolo…</p>}
    </div>
  );
}

/** Relazione salvata: i numeri di allora, con esportazione PDF. */
export function BoReportSalvato() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["report", id], queryFn: () => fetchReportSingolo(id!), enabled: !!id });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Carico…</p>;
  const r = q.data;
  if (!r) return <p className="text-sm text-muted-foreground">Relazione non trovata.</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm font-semibold">{r.titolo}</p>
          <p className="text-sm text-muted-foreground">Salvata il {formatData(r.created_at, true)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Esporta PDF
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/bo/report">Tutte le relazioni</Link>
          </Button>
        </div>
      </div>
      <DocumentoRelazione r={r.dati} />
    </div>
  );
}
