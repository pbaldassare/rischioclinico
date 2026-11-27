import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aggiornaPratica, fetchPratica } from "@/lib/queries";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatoBadge } from "@/components/StatoBadge";
import { Campo, SelectOpzioni, numeroONull, vuotoANull } from "@/components/Campi";
import { ETICHETTE_SOCCOMBENZA, ETICHETTE_STATO_PRATICA } from "@/lib/labels";
import { formatData, formatEuro } from "@/lib/format";
import type { PraticaLegale } from "@/lib/types";

export function BoLegaleDettaglio() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["pratica", id], queryFn: () => fetchPratica(id!), enabled: !!id });
  if (q.isLoading) return <Caricamento />;
  if (!q.data) return <Vuoto titolo="Non trovata" testo="Pratica assente." />;
  const p = q.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {p.numero_pratica ?? "Pratica legale"}
            <StatoBadge stato={p.stato} mappa={ETICHETTE_STATO_PRATICA} />
          </CardTitle>
          <FormPratica pratica={p} />
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Foro: </span>
            {p.foro ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Iscrizione: </span>
            {formatData(p.data_iscrizione)}
          </p>
          <p>
            <span className="text-muted-foreground">Rischio soccombenza: </span>
            {ETICHETTE_SOCCOMBENZA[p.rischio_soccombenza_codice ?? ""] ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Prossima scadenza: </span>
            {formatData(p.prossima_scadenza)}
          </p>
          <p>
            <span className="text-muted-foreground">Importo preteso: </span>
            {formatEuro(p.importo_preteso)}
          </p>
          <p>
            <span className="text-muted-foreground">Transatto: </span>
            {formatEuro(p.importo_transatto)}
          </p>
          <p>
            <span className="text-muted-foreground">Liquidato: </span>
            {formatEuro(p.importo_liquidato)}
          </p>
          <p>
            <Link className="font-semibold text-primary" to={`/bo/sinistri/${p.sinistro_id}`}>
              Apri sinistro {p.sinistro?.codice_interno ?? ""}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const testo = (v: string | number | null) => (v == null ? "" : String(v));

function iniziale(p: PraticaLegale) {
  return {
    numero_pratica: testo(p.numero_pratica),
    foro: testo(p.foro),
    data_iscrizione: testo(p.data_iscrizione),
    stato: p.stato,
    rischio_soccombenza_codice: testo(p.rischio_soccombenza_codice),
    importo_preteso: testo(p.importo_preteso),
    importo_transatto: testo(p.importo_transatto),
    importo_liquidato: testo(p.importo_liquidato),
    prossima_scadenza: testo(p.prossima_scadenza),
  };
}

function FormPratica({ pratica }: { pratica: PraticaLegale }) {
  const qc = useQueryClient();
  const [aperto, setAperto] = useState(false);
  const [f, setF] = useState(() => iniziale(pratica));
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const salva = useMutation({
    mutationFn: () =>
      aggiornaPratica(pratica.id, {
        numero_pratica: vuotoANull(f.numero_pratica),
        foro: vuotoANull(f.foro),
        data_iscrizione: f.data_iscrizione || null,
        stato: f.stato,
        rischio_soccombenza_codice: f.rischio_soccombenza_codice || null,
        importo_preteso: numeroONull(f.importo_preteso),
        importo_transatto: numeroONull(f.importo_transatto),
        importo_liquidato: numeroONull(f.importo_liquidato),
        prossima_scadenza: f.prossima_scadenza || null,
      }),
    onSuccess: () => {
      toast.success("Pratica aggiornata");
      setAperto(false);
      void qc.invalidateQueries({ queryKey: ["pratica", pratica.id] });
      void qc.invalidateQueries({ queryKey: ["pratiche"] });
      void qc.invalidateQueries({ queryKey: ["pratica-da-sinistro", pratica.sinistro_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={aperto}
      onOpenChange={(v) => {
        if (v) setF(iniziale(pratica));
        setAperto(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Modifica</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifica pratica legale</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Numero pratica">
            <Input value={f.numero_pratica} onChange={(e) => set("numero_pratica", e.target.value)} />
          </Campo>
          <Campo label="Foro">
            <Input value={f.foro} onChange={(e) => set("foro", e.target.value)} />
          </Campo>
          <Campo label="Data iscrizione">
            <Input type="date" value={f.data_iscrizione} onChange={(e) => set("data_iscrizione", e.target.value)} />
          </Campo>
          <Campo label="Prossima scadenza">
            <Input type="date" value={f.prossima_scadenza} onChange={(e) => set("prossima_scadenza", e.target.value)} />
          </Campo>
          <Campo label="Stato">
            <SelectOpzioni value={f.stato} onChange={(v) => set("stato", v)} opzioni={Object.entries(ETICHETTE_STATO_PRATICA)} />
          </Campo>
          <Campo label="Rischio di soccombenza">
            <SelectOpzioni
              value={f.rischio_soccombenza_codice}
              onChange={(v) => set("rischio_soccombenza_codice", v)}
              opzioni={Object.entries(ETICHETTE_SOCCOMBENZA)}
              vuoto="—"
            />
          </Campo>
          <Campo label="Importo preteso (€)">
            <Input type="number" min={0} value={f.importo_preteso} onChange={(e) => set("importo_preteso", e.target.value)} />
          </Campo>
          <Campo label="Importo transatto (€)">
            <Input type="number" min={0} value={f.importo_transatto} onChange={(e) => set("importo_transatto", e.target.value)} />
          </Campo>
          <Campo label="Importo liquidato (€)">
            <Input type="number" min={0} value={f.importo_liquidato} onChange={(e) => set("importo_liquidato", e.target.value)} />
          </Campo>
        </div>
        <Button disabled={salva.isPending} onClick={() => salva.mutate()}>
          Salva
        </Button>
      </DialogContent>
    </Dialog>
  );
}
