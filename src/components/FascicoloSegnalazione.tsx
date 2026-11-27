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
import { aggiornaAzione, fetchAllegati, fetchProfiliAzienda, fetchSinistroDaSegnalazione, rcaDi } from "@/lib/queries";
import { Checkbox } from "@/components/ui/checkbox";
import { Campo, SelectElenco, SelectOpzioni, vuotoANull } from "@/components/Campi";
import { caricaAllegati, urlFirmato } from "@/lib/allegati";
import { AssistenteBozza } from "@/components/AssistenteBozza";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { eOperatore, puoGestireSinistri, puoLavorareSegnalazione } from "@/lib/livelli";
import { formatData } from "@/lib/format";
import { ETICHETTE_M, ETICHETTE_P, ETICHETTE_R, ETICHETTE_STATO_AZIONE } from "@/lib/labels";
import type { AzioneCorrettiva, Segnalazione } from "@/lib/types";
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
  const puoLavorare = puoLavorareSegnalazione(profilo);
  const puoSinistri = puoGestireSinistri(profilo);

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

      <AllegatiSegnalazione segnalazioneId={segnalazione.id} puoCaricare={puoLavorare || eOperatore(profilo)} />
      <CalcoloRca segnalazione={segnalazione} rca={rca} puoLavorare={puoLavorare} compatto={compatto} />
      <Azioni segnalazione={segnalazione} puoLavorare={puoLavorare} compatto={compatto} />
      {sinistroCollegato.data && !eOperatore(profilo) ? (
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
  const [cause, setCause] = useState<string[]>(rca?.cause ?? []);
  const [metodo, setMetodo] = useState(rca?.metodo_codice ?? "rca");
  const [noteAudit, setNoteAudit] = useState(rca?.note_audit ?? "");
  const cat = useCatalog();
  useEffect(() => {
    setP(String(rca?.p ?? "2"));
    setM(String(rca?.m ?? "2"));
    setR(String(rca?.r ?? "2"));
    setFattori(rca?.fattori ?? "");
    setCause(rca?.cause ?? []);
    setMetodo(rca?.metodo_codice ?? "rca");
    setNoteAudit(rca?.note_audit ?? "");
  }, [rca?.id, rca?.p, rca?.m, rca?.r, rca?.fattori, rca?.cause, rca?.metodo_codice, rca?.note_audit]);
  const indice = Number(p) * Number(m) * Number(r);

  const salva = useMutation({
    mutationFn: async () => {
      const payload = {
        segnalazione_id: segnalazione.id,
        metodo_codice: metodo,
        p: Number(p),
        m: Number(m),
        r: Number(r),
        fattori,
        cause,
        note_audit: vuotoANull(noteAudit),
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
      toast.success("Analisi salvata");
      qc.invalidateQueries({ queryKey: ["segnalazione", segnalazione.id] });
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Analisi delle cause e calcolo del rischio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Campo label="Metodo">
          <SelectElenco elenco="metodo_analisi" value={metodo} onChange={setMetodo} />
        </Campo>
        <p className="text-sm text-muted-foreground">
          Indice = Probabilità × Magnitudo × Rilevabilità, ciascuna da 1 a 3: va da 1 (minimo) a 27 (massimo). Dopo la
          verifica delle azioni correttive, rivaluta i tre valori per vedere il rischio residuo.
        </p>
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
          <Label>Categorie di cause</Label>
          <div className="flex flex-wrap gap-4 text-sm">
            {cat.elenco("fattore_rca").map((c) => (
              <label key={c.codice} className="flex items-center gap-2">
                <Checkbox
                  checked={cause.includes(c.codice)}
                  disabled={!puoLavorare}
                  onCheckedChange={(v) =>
                    setCause((prev) => (v === true ? [...prev, c.codice] : prev.filter((x) => x !== c.codice)))
                  }
                />
                {c.etichetta}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Fattori causali (dettaglio)</Label>
          <Textarea value={fattori} onChange={(e) => setFattori(e.target.value)} disabled={!puoLavorare} />
        </div>
        {metodo === "audit" ? (
          <div className="space-y-2">
            <Label>Note dell’audit</Label>
            <Textarea value={noteAudit} onChange={(e) => setNoteAudit(e.target.value)} disabled={!puoLavorare} />
          </div>
        ) : null}
        {puoLavorare ? (
          <>
            <AssistenteBozza
              tipo="rca"
              contesto={{ dinamica: segnalazione.dinamica, impatto: segnalazione.impatto }}
              onUsa={(b) => {
                if (b.p) setP(String(b.p));
                if (b.m) setM(String(b.m));
                if (b.r) setR(String(b.r));
                if (b.fattori) setFattori(b.fattori);
              }}
            />
            <Button className="w-full" onClick={() => salva.mutate()} disabled={salva.isPending}>
              Salva analisi
            </Button>
          </>
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
  const [responsabile, setResponsabile] = useState("");
  const azioni = segnalazione.azioni ?? [];
  const persone = useQuery({
    queryKey: ["profili-azienda", segnalazione.azienda_id],
    queryFn: () => fetchProfiliAzienda(segnalazione.azienda_id),
    enabled: puoLavorare,
  });
  const opzioniPersone = (persone.data ?? []).map((p) => [p.id, p.nome ?? p.email ?? "—"] as [string, string]);

  const aggiungi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("azioni_correttive").insert({
        segnalazione_id: segnalazione.id,
        descrizione,
        scadenza: scadenza || null,
        responsabile_id: responsabile || null,
        stato: "aperta",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Azione aggiunta");
      setDescrizione("");
      setScadenza("");
      setResponsabile("");
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
          <SchedaAzione
            key={a.id}
            azione={a}
            segnalazioneId={segnalazione.id}
            puoLavorare={puoLavorare}
            persone={opzioniPersone}
          />
        ))}
        {puoLavorare ? (
          <div className="space-y-2 pt-2">
            <Label>Nuova azione</Label>
            <Textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Campo label="Responsabile">
                <SelectOpzioni value={responsabile} onChange={setResponsabile} opzioni={opzioniPersone} vuoto="— Da assegnare —" />
              </Campo>
              <Campo label="Scadenza">
                <Input type="date" value={scadenza} onChange={(e) => setScadenza(e.target.value)} />
              </Campo>
            </div>
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

const ESITI_VERIFICA: [string, string][] = [
  ["efficace", "Efficace"],
  ["parzialmente_efficace", "Parzialmente efficace"],
  ["non_efficace", "Non efficace"],
];

function SchedaAzione({
  azione,
  segnalazioneId,
  puoLavorare,
  persone,
}: {
  azione: AzioneCorrettiva;
  segnalazioneId: string;
  puoLavorare: boolean;
  persone: [string, string][];
}) {
  const qc = useQueryClient();
  const scaduta = azione.scadenza && azione.stato !== "verificata" && azione.scadenza < new Date().toISOString().slice(0, 10);
  const nomeResponsabile = persone.find(([id]) => id === azione.responsabile_id)?.[1];
  const aggiorna = useMutation({
    mutationFn: (input: Parameters<typeof aggiornaAzione>[1]) => aggiornaAzione(azione.id, input),
    onSuccess: () => {
      toast.success("Azione aggiornata");
      qc.invalidateQueries({ queryKey: ["segnalazione", segnalazioneId] });
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3 rounded-[19px] border border-border bg-card p-3 shadow-card">
      <div>
        <p className="text-sm font-semibold">{azione.descrizione}</p>
        <p className={cn("text-xs text-muted-foreground", scaduta && "font-semibold text-destructive")}>
          {ETICHETTE_STATO_AZIONE[azione.stato] ?? azione.stato}
          {azione.scadenza ? ` · scadenza ${formatData(azione.scadenza)}${scaduta ? " (scaduta)" : ""}` : ""}
          {nomeResponsabile ? ` · ${nomeResponsabile}` : ""}
          {azione.esito_verifica
            ? ` · verifica: ${ESITI_VERIFICA.find(([c]) => c === azione.esito_verifica)?.[1] ?? azione.esito_verifica}`
            : ""}
        </p>
      </div>
      {puoLavorare ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Campo label="Responsabile">
            <SelectOpzioni
              value={azione.responsabile_id ?? ""}
              onChange={(v) => aggiorna.mutate({ responsabile_id: v || null })}
              opzioni={persone}
              vuoto="— Da assegnare —"
            />
          </Campo>
          <Campo label="Stato">
            <SelectOpzioni
              value={azione.stato}
              onChange={(v) =>
                aggiorna.mutate(
                  v === "verificata" ? { stato: v } : { stato: v, verificata_il: null, esito_verifica: null },
                )
              }
              opzioni={Object.entries(ETICHETTE_STATO_AZIONE)}
            />
          </Campo>
          {azione.stato === "verificata" ? (
            <Campo label="Esito della verifica">
              <SelectOpzioni
                value={azione.esito_verifica ?? ""}
                onChange={(v) =>
                  aggiorna.mutate({ esito_verifica: v || null, verificata_il: v ? new Date().toISOString().slice(0, 10) : null })
                }
                opzioni={ESITI_VERIFICA}
                vuoto="—"
              />
            </Campo>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Tipo di evento della segnalazione -> classificazione del sinistro (le voci non elencate diventano "altro").
const TIPO_SINISTRO_DA_EVENTO: Record<string, string> = {
  caduta: "caduta",
  violenza_paziente: "aggressione",
  violenza_operatore: "aggressione",
  infezione: "infezione",
  procedura_chirurgica: "chirurgico",
  lista_operatoria: "chirurgico",
  diagnosi: "diagnostico",
  procedura_diagnostica: "diagnostico",
  campioni: "diagnostico",
  gestione_farmaco: "terapeutico",
  procedura_terapeutica: "terapeutico",
  chemioterapia: "terapeutico",
  sangue: "terapeutico",
  anestesia: "anestesiologico",
  suicidio: "autolesione",
};

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
        tipo_sinistro_codice: TIPO_SINISTRO_DA_EVENTO[segnalazione.tipo_evento_codice ?? ""] ?? "altro",
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

function AllegatiSegnalazione({ segnalazioneId, puoCaricare }: { segnalazioneId: string; puoCaricare: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["allegati", segnalazioneId],
    queryFn: () => fetchAllegati(segnalazioneId),
  });
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const next: Record<string, string> = {};
      for (const a of q.data ?? []) {
        if (!a.url) continue;
        const u = await urlFirmato(a.url);
        if (u) next[a.id] = u;
      }
      if (vivo) setUrls(next);
    })();
    return () => {
      vivo = false;
    };
  }, [q.data]);

  async function onFile(lista: FileList | null) {
    if (!lista?.length) return;
    try {
      await caricaAllegati(segnalazioneId, [...lista]);
      toast.success("Allegato caricato");
      void qc.invalidateQueries({ queryKey: ["allegati", segnalazioneId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Caricamento non riuscito");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Allegati</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(q.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nessun file.</p> : null}
        <ul className="space-y-2">
          {(q.data ?? []).map((a) => (
            <li key={a.id}>
              {urls[a.id] ? (
                <a className="text-sm font-semibold text-primary" href={urls[a.id]} target="_blank" rel="noreferrer">
                  {a.nome_file}
                </a>
              ) : (
                <span className="text-sm">{a.nome_file}</span>
              )}
            </li>
          ))}
        </ul>
        {puoCaricare ? (
          <Input type="file" accept="image/*,application/pdf" onChange={(e) => void onFile(e.target.files)} />
        ) : null}
      </CardContent>
    </Card>
  );
}
