import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Campo, SelectElenco, SelectOpzioni, SESSO, numeroONull, vuotoANull } from "@/components/Campi";
import type { EventoSentinella, TipoSentinella } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { aggiornaEventoSentinella, creaTipoSentinella, disattivaTipoSentinella, fetchEventiSentinella } from "@/lib/queries";
import { eAdmin, ePresidio } from "@/lib/livelli";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export function BoSentinella() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const filtri = filtriPerProfilo(profilo);
  const q = useQuery({ queryKey: ["sentinella", filtri], queryFn: () => fetchEventiSentinella(filtri) });
  const conteggi = new Map<number, number>();
  for (const e of q.data ?? []) conteggi.set(e.tipo_codice, (conteggi.get(e.tipo_codice) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <TabellaTipi
        titolo="Protocollo Ministero 2024 — 23 tipi"
        tipi={cat.tipiSentinella.filter((t) => t.fonte !== "aggiuntivo")}
        conteggi={conteggi}
      />
      <TabellaTipi
        titolo="Eventi aggiuntivi"
        aperto
        nota="Definiti dalle ASL oltre al protocollo. Li vedono tutti, entrano nelle tendine e l’assistente li riconosce come gli altri."
        tipi={cat.tipiSentinella.filter((t) => t.fonte === "aggiuntivo")}
        conteggi={conteggi}
        gestione={eAdmin(profilo) || ePresidio(profilo)}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Schede</CardTitle>
          <p className="text-sm text-muted-foreground">
            Si creano da sole quando una segnalazione è marcata come evento sentinella.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Presidio</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Scheda A</TableHead>
                <TableHead>Scheda B</TableHead>
                <TableHead>Collegamenti</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {e.tipo_codice}. {cat.sentinellaEtichetta(e.tipo_codice)}
                  </TableCell>
                  <TableCell>{e.presidio?.nome}</TableCell>
                  <TableCell>{formatData(e.data_ora_evento, true)}</TableCell>
                  <TableCell>{formatData(e.scheda_a_inviata_il)}</TableCell>
                  <TableCell>{formatData(e.scheda_b_inviata_il)}</TableCell>
                  <TableCell className="space-x-3">
                    {e.segnalazione_id ? (
                      <Link className="text-primary" to={`/bo/segnalazioni/${e.segnalazione_id}`}>
                        Segnalazione
                      </Link>
                    ) : null}
                    {e.sinistro_id ? (
                      <Link className="text-primary" to={`/bo/sinistri/${e.sinistro_id}`}>
                        Sinistro
                      </Link>
                    ) : null}
                    {!e.segnalazione_id && !e.sinistro_id ? "—" : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <FormScheda evento={e} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function TabellaTipi({
  titolo,
  nota,
  tipi,
  conteggi,
  gestione,
  aperto,
}: {
  titolo: string;
  nota?: string;
  tipi: TipoSentinella[];
  conteggi: Map<number, number>;
  gestione?: boolean;
  aperto?: boolean;
}) {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const qc = useQueryClient();
  const [etichetta, setEtichetta] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const ricarica = () => void qc.invalidateQueries({ queryKey: ["tipi-sentinella"] });
  const crea = useMutation({
    mutationFn: () => creaTipoSentinella({ etichetta: etichetta.trim(), descrizione: descrizione.trim() || null, azienda_id: profilo?.azienda_id ?? null }),
    onSuccess: () => {
      toast.success("Evento sentinella aggiunto");
      setEtichetta("");
      setDescrizione("");
      ricarica();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const disattiva = useMutation({
    mutationFn: (codice: number) => disattivaTipoSentinella(codice),
    onSuccess: ricarica,
    onError: (e: Error) => toast.error(e.message),
  });
  const casiTotali = tipi.reduce((n, t) => n + (conteggi.get(t.codice) ?? 0), 0);
  return (
    <Card>
      {/* Fisarmonica nativa: la pagina resta corta, il protocollo si apre solo se serve. */}
      <details open={aperto} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block font-display text-xl font-semibold">{titolo}</span>
            {nota ? <span className="block text-sm text-muted-foreground">{nota}</span> : null}
          </span>
          <span className="flex flex-none items-center gap-3 text-sm text-muted-foreground">
            {tipi.length} tipi · {casiTotali} casi
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>
      <CardContent className="space-y-4">
        {tipi.length === 0 ? <p className="text-sm text-muted-foreground">Nessun evento aggiuntivo. Aggiungilo qui sotto.</p> : null}
        {tipi.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Evento sentinella</TableHead>
                {gestione ? <TableHead>ASL</TableHead> : null}
                <TableHead>Casi in archivio</TableHead>
                {gestione ? <TableHead /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipi.map((t) => {
                const casi = conteggi.get(t.codice) ?? 0;
                const mio = eAdmin(profilo) || (t.azienda_id != null && t.azienda_id === profilo?.azienda_id);
                return (
                  <TableRow key={t.codice}>
                    <TableCell className="font-semibold">{t.codice}</TableCell>
                    <TableCell>
                      {t.etichetta}
                      {t.descrizione ? <p className="text-xs text-muted-foreground">{t.descrizione}</p> : null}
                    </TableCell>
                    {gestione ? <TableCell className="text-muted-foreground">{t.azienda_id ? cat.nomeAzienda(t.azienda_id) : "—"}</TableCell> : null}
                    <TableCell>{casi}</TableCell>
                    {gestione ? (
                      <TableCell className="text-right">
                        {mio && casi === 0 ? (
                          <button type="button" className="text-xs font-semibold text-destructive" onClick={() => disattiva.mutate(t.codice)}>
                            Rimuovi
                          </button>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
        {gestione ? (
          <div className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="nuovo-sentinella">Nuovo evento sentinella</Label>
              <Input id="nuovo-sentinella" value={etichetta} onChange={(e) => setEtichetta(e.target.value)} placeholder="Es. Aggressione con arma a operatore" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuovo-sentinella-desc">Quando si applica (aiuta l’assistente)</Label>
              <Input id="nuovo-sentinella-desc" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Es. uso di oggetti contundenti o taglienti contro il personale" />
            </div>
            <div className="flex items-end">
              <Button disabled={!etichetta.trim() || crea.isPending} onClick={() => crea.mutate()}>
                Aggiungi
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
      </details>
    </Card>
  );
}

const testo = (v: string | number | null) => (v == null ? "" : String(v));

function iniziale(e: EventoSentinella) {
  return {
    tipo_codice: String(e.tipo_codice),
    esito_codice: testo(e.esito_codice),
    fonte_codice: testo(e.fonte_codice),
    metodo_analisi_codice: testo(e.metodo_analisi_codice),
    scheda_a_inviata_il: testo(e.scheda_a_inviata_il),
    scheda_b_inviata_il: testo(e.scheda_b_inviata_il),
    sesso: testo(e.sesso),
    anno_nascita: testo(e.anno_nascita),
    fattori_contribuenti: testo(e.fattori_contribuenti),
    piano_azione: testo(e.piano_azione),
  };
}

function FormScheda({ evento }: { evento: EventoSentinella }) {
  const cat = useCatalog();
  const qc = useQueryClient();
  const [aperto, setAperto] = useState(false);
  const [f, setF] = useState(() => iniziale(evento));
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const salva = useMutation({
    mutationFn: () =>
      aggiornaEventoSentinella(evento.id, {
        tipo_codice: Number(f.tipo_codice),
        esito_codice: f.esito_codice || null,
        fonte_codice: f.fonte_codice || null,
        metodo_analisi_codice: f.metodo_analisi_codice || null,
        scheda_a_inviata_il: f.scheda_a_inviata_il || null,
        scheda_b_inviata_il: f.scheda_b_inviata_il || null,
        sesso: (f.sesso || null) as EventoSentinella["sesso"],
        anno_nascita: numeroONull(f.anno_nascita),
        fattori_contribuenti: vuotoANull(f.fattori_contribuenti),
        piano_azione: vuotoANull(f.piano_azione),
      }),
    onSuccess: () => {
      toast.success("Scheda aggiornata");
      setAperto(false);
      void qc.invalidateQueries({ queryKey: ["sentinella"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={aperto}
      onOpenChange={(v) => {
        if (v) setF(iniziale(evento));
        setAperto(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Scheda
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scheda evento sentinella</DialogTitle>
        </DialogHeader>
        <Campo label="Tipo di evento sentinella">
          <SelectOpzioni
            value={f.tipo_codice}
            onChange={(v) => set("tipo_codice", v)}
            opzioni={cat.tipiSentinella.map((t) => [String(t.codice), `${t.codice}. ${t.etichetta}`])}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Esito">
            <SelectElenco elenco="esito" value={f.esito_codice} onChange={(v) => set("esito_codice", v)} vuoto="—" />
          </Campo>
          <Campo label="Fonte">
            <SelectElenco elenco="fonte_sentinella" value={f.fonte_codice} onChange={(v) => set("fonte_codice", v)} vuoto="—" />
          </Campo>
          <Campo label="Metodo di analisi">
            <SelectElenco
              elenco="metodo_analisi"
              value={f.metodo_analisi_codice}
              onChange={(v) => set("metodo_analisi_codice", v)}
              vuoto="—"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Sesso">
              <SelectOpzioni value={f.sesso} onChange={(v) => set("sesso", v)} opzioni={SESSO} vuoto="—" />
            </Campo>
            <Campo label="Anno di nascita">
              <Input type="number" min={1900} max={2100} value={f.anno_nascita} onChange={(e) => set("anno_nascita", e.target.value)} />
            </Campo>
          </div>
          <Campo label="Scheda A inviata il">
            <Input type="date" value={f.scheda_a_inviata_il} onChange={(e) => set("scheda_a_inviata_il", e.target.value)} />
          </Campo>
          <Campo label="Scheda B inviata il">
            <Input type="date" value={f.scheda_b_inviata_il} onChange={(e) => set("scheda_b_inviata_il", e.target.value)} />
          </Campo>
        </div>
        <Campo label="Fattori contribuenti">
          <Textarea value={f.fattori_contribuenti} onChange={(e) => set("fattori_contribuenti", e.target.value)} />
        </Campo>
        <Campo label="Piano d’azione">
          <Textarea value={f.piano_azione} onChange={(e) => set("piano_azione", e.target.value)} />
        </Campo>
        <Button disabled={salva.isPending} onClick={() => salva.mutate()}>
          Salva
        </Button>
      </DialogContent>
    </Dialog>
  );
}
