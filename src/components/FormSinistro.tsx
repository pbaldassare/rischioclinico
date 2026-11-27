import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Campo,
  SceltaPresidioReparto,
  SelectElenco,
  SelectOpzioni,
  SESSO,
  numeroONull,
  vuotoANull,
} from "@/components/Campi";
import { useCatalog } from "@/lib/catalog";
import { salvaSinistro } from "@/lib/queries";
import { ETICHETTE_STATO_SINISTRO } from "@/lib/labels";
import type { Sinistro } from "@/lib/types";

function iniziale(s?: Sinistro) {
  return {
    presidio_id: s?.presidio_id ?? "",
    unita_operativa_id: s?.unita_operativa_id ?? "",
    codice_interno: s?.codice_interno ?? "",
    codice_simes: s?.codice_simes ?? "",
    data_evento: s?.data_evento ?? "",
    data_denuncia: s?.data_denuncia ?? new Date().toISOString().slice(0, 10),
    tipo_sinistro_codice: s?.tipo_sinistro_codice ?? "",
    tipo_danno_codice: s?.tipo_danno_codice ?? "",
    tipo_danneggiato_codice: s?.tipo_danneggiato_codice ?? "paziente",
    sesso_danneggiato: s?.sesso_danneggiato ?? "",
    eta_danneggiato: s?.eta_danneggiato?.toString() ?? "",
    fase_cura_codice: s?.fase_cura_codice ?? "",
    stato: s?.stato ?? "aperto",
    compagnia: s?.compagnia ?? "",
    descrizione: s?.descrizione ?? "",
    sentinella: s?.sentinella ?? false,
    denuncia_cautelativa: s?.denuncia_cautelativa ?? false,
  };
}

/** Nuovo sinistro (senza `sinistro`) o modifica di uno esistente. */
export function FormSinistro({ sinistro, onCreato }: { sinistro?: Sinistro; onCreato?: (id: string) => void }) {
  const cat = useCatalog();
  const qc = useQueryClient();
  const [aperto, setAperto] = useState(false);
  const [f, setF] = useState(() => iniziale(sinistro));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const salva = useMutation({
    mutationFn: () => {
      const azienda_id = cat.presidi.find((p) => p.id === f.presidio_id)?.azienda_id;
      if (!azienda_id) throw new Error("Scegli l’ospedale");
      return salvaSinistro(sinistro?.id ?? null, {
        azienda_id,
        presidio_id: f.presidio_id,
        unita_operativa_id: f.unita_operativa_id || null,
        codice_interno: vuotoANull(f.codice_interno),
        codice_simes: vuotoANull(f.codice_simes),
        data_evento: f.data_evento || null,
        data_denuncia: f.data_denuncia || null,
        tipo_sinistro_codice: f.tipo_sinistro_codice || null,
        tipo_danno_codice: f.tipo_danno_codice || null,
        tipo_danneggiato_codice: f.tipo_danneggiato_codice || null,
        sesso_danneggiato: (f.sesso_danneggiato || null) as Sinistro["sesso_danneggiato"],
        eta_danneggiato: numeroONull(f.eta_danneggiato),
        fase_cura_codice: f.fase_cura_codice || null,
        stato: f.stato,
        compagnia: vuotoANull(f.compagnia),
        descrizione: vuotoANull(f.descrizione),
        sentinella: f.sentinella,
        denuncia_cautelativa: f.denuncia_cautelativa,
      });
    },
    onSuccess: (id) => {
      toast.success(sinistro ? "Sinistro aggiornato" : "Sinistro creato");
      setAperto(false);
      void qc.invalidateQueries({ queryKey: ["sinistri"] });
      void qc.invalidateQueries({ queryKey: ["sinistro", id] });
      if (!sinistro) onCreato?.(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const obbligatori = f.presidio_id && f.data_evento && f.tipo_sinistro_codice && f.tipo_danno_codice;

  return (
    <Dialog
      open={aperto}
      onOpenChange={(v) => {
        if (v) setF(iniziale(sinistro));
        setAperto(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={sinistro ? "outline" : "default"}>{sinistro ? "Modifica" : "Nuovo sinistro"}</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sinistro ? "Modifica sinistro" : "Nuovo sinistro"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <SceltaPresidioReparto
            presidioId={f.presidio_id}
            unitaId={f.unita_operativa_id}
            onChange={(p, u) => setF((prev) => ({ ...prev, presidio_id: p, unita_operativa_id: u }))}
          />
          <Campo label="Codice interno">
            <Input value={f.codice_interno} onChange={(e) => set("codice_interno", e.target.value)} />
          </Campo>
          <Campo label="Codice SIMES">
            <Input value={f.codice_simes} onChange={(e) => set("codice_simes", e.target.value)} />
          </Campo>
          <Campo label="Data evento *">
            <Input type="date" value={f.data_evento} onChange={(e) => set("data_evento", e.target.value)} />
          </Campo>
          <Campo label="Data denuncia">
            <Input type="date" value={f.data_denuncia} onChange={(e) => set("data_denuncia", e.target.value)} />
          </Campo>
          <Campo label="Classificazione *">
            <SelectElenco elenco="tipo_sinistro" value={f.tipo_sinistro_codice} onChange={(v) => set("tipo_sinistro_codice", v)} />
          </Campo>
          <Campo label="Tipo di danno *">
            <SelectElenco elenco="tipo_danno" value={f.tipo_danno_codice} onChange={(v) => set("tipo_danno_codice", v)} />
          </Campo>
          <Campo label="Fase di cura">
            <SelectElenco elenco="fase_cura" value={f.fase_cura_codice} onChange={(v) => set("fase_cura_codice", v)} vuoto="—" />
          </Campo>
          <Campo label="Stato">
            <SelectOpzioni value={f.stato} onChange={(v) => set("stato", v)} opzioni={Object.entries(ETICHETTE_STATO_SINISTRO)} />
          </Campo>
          <Campo label="Danneggiato">
            <SelectElenco
              elenco="tipo_danneggiato"
              value={f.tipo_danneggiato_codice}
              onChange={(v) => set("tipo_danneggiato_codice", v)}
              vuoto="—"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Sesso">
              <SelectOpzioni value={f.sesso_danneggiato} onChange={(v) => set("sesso_danneggiato", v)} opzioni={SESSO} vuoto="—" />
            </Campo>
            <Campo label="Età">
              <Input
                type="number"
                min={0}
                max={120}
                value={f.eta_danneggiato}
                onChange={(e) => set("eta_danneggiato", e.target.value)}
              />
            </Campo>
          </div>
          <Campo label="Compagnia">
            <Input value={f.compagnia} onChange={(e) => set("compagnia", e.target.value)} />
          </Campo>
          <div className="flex flex-col justify-end gap-3 pb-2">
            <Interruttore label="Evento sentinella" checked={f.sentinella} onChange={(v) => set("sentinella", v)} />
            <Interruttore
              label="Denuncia cautelativa"
              checked={f.denuncia_cautelativa}
              onChange={(v) => set("denuncia_cautelativa", v)}
            />
          </div>
        </div>
        <Campo label="Descrizione">
          <Textarea value={f.descrizione} onChange={(e) => set("descrizione", e.target.value)} />
        </Campo>
        <p className="text-xs text-muted-foreground">* campi obbligatori</p>
        <Button disabled={!obbligatori || salva.isPending} onClick={() => salva.mutate()}>
          Salva
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Interruttore({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
