import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aggiungiMovimento, creaPratica, eliminaMovimento, fetchPraticaDaSinistro, fetchSinistro } from "@/lib/queries";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatoBadge } from "@/components/StatoBadge";
import { FormSinistro } from "@/components/FormSinistro";
import { Campo, SelectElenco, vuotoANull } from "@/components/Campi";
import { ETICHETTE_STATO_SINISTRO } from "@/lib/labels";
import { useCatalog } from "@/lib/catalog";
import { formatData, formatEuro, sommaMovimenti } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Sinistro } from "@/lib/types";

export function BoSinistroDettaglio() {
  const { id } = useParams();
  const cat = useCatalog();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["sinistro", id], queryFn: () => fetchSinistro(id!), enabled: !!id });
  const pratica = useQuery({
    queryKey: ["pratica-da-sinistro", id],
    queryFn: () => fetchPraticaDaSinistro(id!),
    enabled: !!id,
  });
  const apriPratica = useMutation({
    mutationFn: () => creaPratica(id!),
    onSuccess: (praticaId) => {
      toast.success("Pratica legale aperta");
      void qc.invalidateQueries({ queryKey: ["pratica-da-sinistro", id] });
      void qc.invalidateQueries({ queryKey: ["pratiche"] });
      navigate(`/bo/legale/${praticaId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Caricamento />;
  if (!q.data) return <Vuoto titolo="Non trovato" testo="Sinistro assente." />;
  const s = q.data;
  const danneggiato = [
    cat.etichetta("tipo_danneggiato", s.tipo_danneggiato_codice),
    s.sesso_danneggiato,
    s.eta_danneggiato != null ? `${s.eta_danneggiato} anni` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {s.codice_interno ?? "Sinistro"}
            <StatoBadge stato={s.stato} mappa={ETICHETTE_STATO_SINISTRO} />
          </CardTitle>
          <FormSinistro sinistro={s} />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Riga k="Ospedale" v={s.presidio?.nome} />
            <Riga k="Reparto" v={s.unita?.nome} />
            <Riga k="Classificazione" v={cat.etichetta("tipo_sinistro", s.tipo_sinistro_codice)} />
            <Riga k="Tipo di danno" v={cat.etichetta("tipo_danno", s.tipo_danno_codice)} />
            <Riga k="Fase di cura" v={cat.etichetta("fase_cura", s.fase_cura_codice)} />
            <Riga k="Danneggiato" v={danneggiato} />
            <Riga k="Data evento" v={formatData(s.data_evento)} />
            <Riga k="Data denuncia" v={formatData(s.data_denuncia)} />
            <Riga k="Compagnia" v={s.compagnia} />
            <Riga k="Codice SIMES" v={s.codice_simes} />
            <Riga k="Sentinella" v={s.sentinella ? "Sì" : "No"} />
            <Riga k="Denuncia cautelativa" v={s.denuncia_cautelativa ? "Sì" : "No"} />
          </dl>
          {s.descrizione ? <p className="leading-relaxed">{s.descrizione}</p> : null}
          <div className="flex flex-wrap gap-3">
            {s.segnalazione_id ? (
              <Link className="font-semibold text-primary" to={`/bo/segnalazioni/${s.segnalazione_id}`}>
                Segnalazione di origine
              </Link>
            ) : (
              <span className="text-muted-foreground">Nessuna segnalazione collegata</span>
            )}
            {pratica.data ? (
              <Link className="font-semibold text-primary" to={`/bo/legale/${pratica.data.id}`}>
                Pratica legale {pratica.data.numero_pratica ?? ""}
              </Link>
            ) : null}
          </div>
          {!pratica.isLoading && !pratica.data ? (
            <Button variant="secondary" onClick={() => apriPratica.mutate()} disabled={apriPratica.isPending}>
              Apri pratica legale
            </Button>
          ) : null}
        </CardContent>
      </Card>
      <Movimenti sinistro={s} />
    </div>
  );
}

function Riga({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
      <dd>{v || "—"}</dd>
    </div>
  );
}

function Movimenti({ sinistro }: { sinistro: Sinistro }) {
  const cat = useCatalog();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState("riservato");
  const [importo, setImporto] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const aggiorna = () => {
    void qc.invalidateQueries({ queryKey: ["sinistro", sinistro.id] });
    void qc.invalidateQueries({ queryKey: ["sinistri"] });
  };
  const aggiungi = useMutation({
    mutationFn: () =>
      aggiungiMovimento({
        sinistro_id: sinistro.id,
        tipo,
        importo: Number(importo),
        data_movimento: data || null,
        nota: vuotoANull(nota),
      }),
    onSuccess: () => {
      toast.success("Movimento registrato");
      setImporto("");
      setNota("");
      aggiorna();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const elimina = useMutation({
    mutationFn: eliminaMovimento,
    onSuccess: () => {
      toast.success("Movimento eliminato");
      aggiorna();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const importoValido = importo !== "" && Number(importo) >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Movimenti economici</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Importo</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sinistro.movimenti ?? []).map((m) => (
              <TableRow key={m.id}>
                <TableCell>{cat.etichetta("tipo_movimento", m.tipo)}</TableCell>
                <TableCell>{formatData(m.data_movimento)}</TableCell>
                <TableCell>{formatEuro(m.importo)}</TableCell>
                <TableCell className="text-muted-foreground">{m.nota}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={elimina.isPending}
                    onClick={() => {
                      if (window.confirm("Eliminare questo movimento?")) elimina.mutate(m.id);
                    }}
                  >
                    Elimina
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold" colSpan={2}>
                Riservato + liquidato
              </TableCell>
              <TableCell className="font-semibold" colSpan={3}>
                {formatEuro(sommaMovimenti(sinistro.movimenti, ["riservato", "liquidato"]))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="grid gap-3 sm:grid-cols-5">
          <Campo label="Tipo">
            <SelectElenco elenco="tipo_movimento" value={tipo} onChange={setTipo} />
          </Campo>
          <Campo label="Importo (€)">
            <Input type="number" min={0} step="0.01" value={importo} onChange={(e) => setImporto(e.target.value)} />
          </Campo>
          <Campo label="Data">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Campo>
          <Campo label="Nota">
            <Input value={nota} onChange={(e) => setNota(e.target.value)} />
          </Campo>
          <div className="flex items-end">
            <Button className="w-full" disabled={!importoValido || aggiungi.isPending} onClick={() => aggiungi.mutate()}>
              Aggiungi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
