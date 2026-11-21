import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatoBadge } from "@/components/StatoBadge";
import { supabase } from "@/lib/supabase";
import { fetchSinistroDaSegnalazione, rcaDi } from "@/lib/queries";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { formatData } from "@/lib/format";
import { ETICHETTE_M, ETICHETTE_P, ETICHETTE_R } from "@/lib/labels";
import type { Segnalazione } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FascicoloSegnalazione({
  segnalazione,
  compatto,
}: {
  segnalazione: Segnalazione;
  compatto?: boolean;
}) {
  const cat = useCatalog();
  const { profilo } = useAuth();
  const qc = useQueryClient();
  const rca = rcaDi(segnalazione);
  const sinistroCollegato = useQuery({
    queryKey: ["sinistro-da-segnalazione", segnalazione.id],
    queryFn: () => fetchSinistroDaSegnalazione(segnalazione.id),
  });
  const puoLavorare = ["referente_rischio", "amministratore", "direzione"].includes(profilo?.ruolo ?? "");
  const puoSinistri = ["amministrativo_sinistri", "referente_rischio", "amministratore"].includes(profilo?.ruolo ?? "");

  const prendi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("segnalazioni")
        .update({
          stato: "in_lavorazione",
          preso_in_carico_da: profilo?.id,
          preso_in_carico_il: new Date().toISOString(),
        })
        .eq("id", segnalazione.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segnalazione presa in carico");
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
      qc.invalidateQueries({ queryKey: ["segnalazione", segnalazione.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const chiudi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("segnalazioni").update({ stato: "completata" }).eq("id", segnalazione.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Segnalazione completata");
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
      qc.invalidateQueries({ queryKey: ["segnalazione", segnalazione.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const Wrap = compatto ? "div" : Card;
  const wrapClass = compatto ? "space-y-3" : "";

  return (
    <div className="space-y-4">
      <Wrap className={wrapClass}>
        {!compatto ? (
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              {cat.etichetta("tipo_evento_ir", segnalazione.tipo_evento_codice)}
              <StatoBadge stato={segnalazione.stato} />
              {segnalazione.anonima ? (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-display text-[10.5px] font-bold">
                  Anonima
                </span>
              ) : null}
              {segnalazione.sentinella ? (
                <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 font-display text-[10.5px] font-bold text-destructive-ink">
                  Sentinella
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
        ) : null}
        <CardContent className={cn(compatto && "p-0")}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Riga k="Data evento" v={formatData(segnalazione.data_ora_evento, true)} />
            <Riga k="Presidio" v={segnalazione.presidio?.nome ?? cat.nomePresidio(segnalazione.presidio_id)} />
            <Riga k="Reparto" v={segnalazione.unita?.nome ?? cat.nomeUnita(segnalazione.unita_operativa_id)} />
            <Riga k="Luogo" v={cat.etichetta("luogo", segnalazione.luogo_codice)} />
            <Riga k="Gravità" v={cat.etichetta("gravita", segnalazione.gravita_codice)} />
            <Riga k="Magnitudo" v={cat.etichetta("magnitudo", segnalazione.magnitudo_codice)} />
            <Riga k="Fase di cura" v={cat.etichetta("fase_cura", segnalazione.fase_cura_codice)} />
            {segnalazione.tipo_sentinella_codice ? (
              <Riga k="Tipo sentinella" v={cat.sentinellaEtichetta(segnalazione.tipo_sentinella_codice)} />
            ) : null}
          </dl>
          <p className="mt-4 text-sm leading-relaxed">{segnalazione.dinamica || "Nessuna dinamica."}</p>
          {segnalazione.impatto ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Impatto: </span>
              {segnalazione.impatto}
            </p>
          ) : null}

          {puoLavorare && segnalazione.stato === "inviata" ? (
            <Button className="mt-4 w-full sm:w-auto" onClick={() => prendi.mutate()} disabled={prendi.isPending}>
              Prendi in carico
            </Button>
          ) : null}
          {puoLavorare && segnalazione.stato === "in_lavorazione" ? (
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => chiudi.mutate()}
              disabled={chiudi.isPending}
            >
              Completa
            </Button>
          ) : null}
        </CardContent>
      </Wrap>

      <CalcoloRca segnalazione={segnalazione} rca={rca} puoLavorare={puoLavorare} compatto={compatto} />
      <Azioni segnalazione={segnalazione} puoLavorare={puoLavorare} compatto={compatto} />
      {sinistroCollegato.data ? (
        <Link
          to={`/bo/sinistri/${sinistroCollegato.data.id}`}
          className="flex min-h-11 items-center justify-center rounded-full border border-border bg-card font-semibold"
        >
          Sinistro collegato {sinistroCollegato.data.codice_interno}
        </Link>
      ) : puoSinistri && segnalazione.stato !== "inviata" ? (
        <ApriSinistro segnalazione={segnalazione} />
      ) : null}
    </div>
  );
}

function Riga({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function CalcoloRca({
  segnalazione,
  rca,
  puoLavorare,
  compatto,
}: {
  segnalazione: Segnalazione;
  rca: ReturnType<typeof rcaDi>;
  puoLavorare: boolean;
  compatto?: boolean;
}) {
  const qc = useQueryClient();
  const [p, setP] = useState(String(rca?.p ?? "2"));
  const [m, setM] = useState(String(rca?.m ?? "2"));
  const [r, setR] = useState(String(rca?.r ?? "2"));
  const [fattori, setFattori] = useState(rca?.fattori ?? "");
  useEffect(() => {
    setP(String(rca?.p ?? "2"));
    setM(String(rca?.m ?? "2"));
    setR(String(rca?.r ?? "2"));
    setFattori(rca?.fattori ?? "");
  }, [rca?.id, rca?.p, rca?.m, rca?.r, rca?.fattori]);
  const indice = Number(p) * Number(m) * Number(r);

  const salva = useMutation({
    mutationFn: async () => {
      const payload = {
        segnalazione_id: segnalazione.id,
        metodo_codice: "rca",
        p: Number(p),
        m: Number(m),
        r: Number(r),
        fattori,
      };
      if (rca?.id) {
        const { error } = await supabase.from("analisi_rca").update(payload).eq("id", rca.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("analisi_rca").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("RCA confermata");
      qc.invalidateQueries({ queryKey: ["segnalazione", segnalazione.id] });
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Calcolo rischio (RCA)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Indice = P × M × R (scala 1–3).</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <CampoScala label="Probabilità (P)" value={p} onChange={setP} mappa={ETICHETTE_P} disabled={!puoLavorare} />
          <CampoScala label="Magnitudo (M)" value={m} onChange={setM} mappa={ETICHETTE_M} disabled={!puoLavorare} />
          <CampoScala label="Rilevabilità (R)" value={r} onChange={setR} mappa={ETICHETTE_R} disabled={!puoLavorare} />
        </div>
        <div className="rounded-[19px] border border-border bg-secondary/60 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Indice di rischio</p>
          <p className="font-display text-4xl font-bold text-primary">{indice}</p>
        </div>
        <div className="space-y-2">
          <Label>Fattori causali</Label>
          <Textarea value={fattori} onChange={(e) => setFattori(e.target.value)} disabled={!puoLavorare} />
        </div>
        {puoLavorare ? (
          <Button className="w-full" onClick={() => salva.mutate()} disabled={salva.isPending}>
            Esegui
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CampoScala({
  label,
  value,
  onChange,
  mappa,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mappa: Record<number, string>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {([1, 2, 3] as const).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} — {mappa[n]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Azioni({
  segnalazione,
  puoLavorare,
}: {
  segnalazione: Segnalazione;
  puoLavorare: boolean;
  compatto?: boolean;
}) {
  const qc = useQueryClient();
  const [descrizione, setDescrizione] = useState("");
  const [scadenza, setScadenza] = useState("");
  const azioni = segnalazione.azioni ?? [];

  const aggiungi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("azioni_correttive").insert({
        segnalazione_id: segnalazione.id,
        descrizione,
        scadenza: scadenza || null,
        stato: "aperta",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Azione aggiunta");
      setDescrizione("");
      setScadenza("");
      qc.invalidateQueries({ queryKey: ["segnalazione", segnalazione.id] });
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Azioni correttive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {azioni.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna azione ancora.</p> : null}
        {azioni.map((a) => (
          <div key={a.id} className="rounded-[19px] border border-border bg-card p-3 shadow-card">
            <p className="text-sm font-semibold">{a.descrizione}</p>
            <p className="text-xs text-muted-foreground">
              {a.stato.replaceAll("_", " ")}
              {a.scadenza ? ` · scadenza ${formatData(a.scadenza)}` : ""}
            </p>
          </div>
        ))}
        {puoLavorare ? (
          <div className="space-y-2 pt-2">
            <Label>Nuova azione</Label>
            <Textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
            <Input type="date" value={scadenza} onChange={(e) => setScadenza(e.target.value)} />
            <Button
              variant="outline"
              className="w-full"
              disabled={!descrizione.trim() || aggiungi.isPending}
              onClick={() => aggiungi.mutate()}
            >
              Aggiungi azione
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ApriSinistro({ segnalazione }: { segnalazione: Segnalazione; compatto?: boolean }) {
  const qc = useQueryClient();
  const apri = useMutation({
    mutationFn: async () => {
      const { data: esistenti, error: errCheck } = await supabase
        .from("sinistri")
        .select("id")
        .eq("segnalazione_id", segnalazione.id);
      if (errCheck) throw errCheck;
      if (esistenti?.length) throw new Error("Esiste già un sinistro collegato");
      const { error } = await supabase.from("sinistri").insert({
        azienda_id: segnalazione.azienda_id,
        presidio_id: segnalazione.presidio_id,
        unita_operativa_id: segnalazione.unita_operativa_id,
        segnalazione_id: segnalazione.id,
        data_evento: segnalazione.data_ora_evento?.slice(0, 10) ?? null,
        data_apertura: new Date().toISOString().slice(0, 10),
        sentinella: segnalazione.sentinella,
        tipo_sinistro_codice: segnalazione.tipo_evento_codice === "caduta" ? "caduta" : "altro",
        fase_cura_codice: segnalazione.fase_cura_codice,
        stato: "aperto",
        codice_interno: `SIN-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sinistro aperto dalla segnalazione");
      qc.invalidateQueries({ queryKey: ["sinistri"] });
      qc.invalidateQueries({ queryKey: ["sinistro-da-segnalazione", segnalazione.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Button variant="secondary" className="w-full" onClick={() => apri.mutate()} disabled={apri.isPending}>
      Apri sinistro collegato
    </Button>
  );
}
