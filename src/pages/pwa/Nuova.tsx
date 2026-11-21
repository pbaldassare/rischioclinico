import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Intestazione } from "@/mobile/Intestazione";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { AssistenteBozza } from "@/components/AssistenteBozza";
import { caricaAllegati } from "@/lib/allegati";

export function PwaNuova() {
  const cat = useCatalog();
  const { profilo } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const presidi = useMemo(
    () => cat.presidi.filter((p) => !profilo?.azienda_id || p.azienda_id === profilo.azienda_id),
    [cat.presidi, profilo],
  );

  const [presidioId, setPresidioId] = useState("");
  const unita = cat.unita.filter((u) => u.presidio_id === presidioId);
  const [unitaId, setUnitaId] = useState("");

  useEffect(() => {
    const preferito = profilo?.presidio_id || presidi[0]?.id || "";
    if (preferito && !presidi.some((p) => p.id === presidioId)) setPresidioId(preferito);
  }, [profilo?.presidio_id, presidi, presidioId]);

  useEffect(() => {
    if (!presidioId) return;
    const delPresidio = cat.unita.filter((u) => u.presidio_id === presidioId);
    if (!delPresidio.length) return;
    if (!delPresidio.some((u) => u.id === unitaId)) {
      const ps = delPresidio.find((u) => /pronto/i.test(u.nome));
      setUnitaId(ps?.id ?? delPresidio[0].id);
    }
  }, [presidioId, cat.unita, unitaId]);
  const [dataOra, setDataOra] = useState(() => oraLocale());
  const [tipo, setTipo] = useState("caduta");
  const [gravita, setGravita] = useState("near_miss");
  const [magnitudo, setMagnitudo] = useState("nessuno");
  const [fase, setFase] = useState("assistenza");
  const [luogo, setLuogo] = useState("pronto_soccorso");
  const [sentinella, setSentinella] = useState(false);
  const [tipoSentinella, setTipoSentinella] = useState("9");
  const [anonima, setAnonima] = useState(false);
  const [dinamica, setDinamica] = useState("");
  const [impatto, setImpatto] = useState("");
  const [invio, setInvio] = useState(false);
  const [fileAllegati, setFileAllegati] = useState<File[]>([]);

  async function invia() {
    if (!dinamica.trim()) {
      toast.error("Descrivi la dinamica");
      return;
    }
    setInvio(true);
    const { data, error } = await supabase
      .from("segnalazioni")
      .insert({
        azienda_id: profilo?.azienda_id ?? cat.aziende[0]?.id,
        presidio_id: presidioId || null,
        unita_operativa_id: unitaId || null,
        luogo_codice: luogo,
        data_ora_evento: new Date(dataOra).toISOString(),
        tipo_evento_codice: tipo,
        gravita_codice: gravita,
        magnitudo_codice: magnitudo,
        fase_cura_codice: fase,
        sentinella,
        tipo_sentinella_codice: sentinella ? Number(tipoSentinella) : null,
        anonima,
        stato: "inviata",
        dinamica,
        impatto: impatto || null,
        inserito_da: anonima ? null : profilo?.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      setInvio(false);
      toast.error(error?.message ?? "Invio non riuscito");
      return;
    }
    try {
      if (fileAllegati.length) await caricaAllegati(data.id, fileAllegati);
      toast.success("Segnalazione inviata");
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
      qc.invalidateQueries({ queryKey: ["allegati", data.id] });
      navigate(`/app/coda/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scheda salvata, allegati non caricati");
      navigate(`/app/coda/${data.id}`);
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione titolo="Nuova segnalazione" sottotitolo="Scheda di incident reporting" indietro />
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void invia();
        }}
      >
        <Campo label="Data e ora evento">
          <Input type="datetime-local" value={dataOra} onChange={(e) => setDataOra(e.target.value)} />
        </Campo>
        <Campo label="Presidio">
          <Select
            value={presidioId || undefined}
            onValueChange={(v) => {
              setPresidioId(v);
              setUnitaId("");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presidi.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Reparto / unità operativa">
          <Select value={unitaId || undefined} onValueChange={setUnitaId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unita.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Luogo">
          <Elenco tipo="luogo" value={luogo} onChange={setLuogo} />
        </Campo>
        <Campo label="Tipologia evento">
          <Elenco tipo="tipo_evento_ir" value={tipo} onChange={setTipo} />
        </Campo>
        <Campo label="Gravità">
          <Elenco tipo="gravita" value={gravita} onChange={setGravita} />
        </Campo>
        <Campo label="Esito / magnitudo">
          <Elenco tipo="magnitudo" value={magnitudo} onChange={setMagnitudo} />
        </Campo>
        <Campo label="Fase di cura">
          <Elenco tipo="fase_cura" value={fase} onChange={setFase} />
        </Campo>
        <div className="flex min-h-11 items-center justify-between rounded-[19px] border border-border bg-card px-4">
          <Label htmlFor="anonima">Segnalazione anonima</Label>
          <Switch id="anonima" checked={anonima} onCheckedChange={setAnonima} />
        </div>
        <div className="flex min-h-11 items-center justify-between rounded-[19px] border border-border bg-card px-4">
          <Label htmlFor="sentinella">Evento sentinella</Label>
          <Switch id="sentinella" checked={sentinella} onCheckedChange={setSentinella} />
        </div>
        {sentinella ? (
          <Campo label="Tipo sentinella (1–23)">
            <Select value={tipoSentinella} onValueChange={setTipoSentinella}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cat.tipiSentinella.map((t) => (
                  <SelectItem key={t.codice} value={String(t.codice)}>
                    {t.codice}. {t.etichetta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
        ) : null}
        <AssistenteBozza
          tipo="segnalazione"
          conVoce
          conFoto
          onUsa={(b) => setDinamica(b.testo)}
        />
        <Campo label="Dinamica">
          <Textarea value={dinamica} onChange={(e) => setDinamica(e.target.value)} required />
        </Campo>
        <Campo label="Impatto (facoltativo)">
          <Textarea value={impatto} onChange={(e) => setImpatto(e.target.value)} />
        </Campo>
        <Campo label="Allegati (foto, PDF)">
          <Input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setFileAllegati([...(e.target.files ?? [])])}
          />
          {fileAllegati.length ? (
            <p className="text-[10.5px] text-muted-foreground">{fileAllegati.length} file pronti all’invio</p>
          ) : (
            <p className="text-[10.5px] text-muted-foreground">Si caricano solo quando confermi Invia segnalazione.</p>
          )}
        </Campo>
        <button
          type="submit"
          disabled={invio}
          className="flex min-h-11 w-full items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {invio ? "Invio…" : "Invia segnalazione"}
        </button>
      </form>
    </div>
  );
}

function oraLocale() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Elenco({ tipo, value, onChange }: { tipo: string; value: string; onChange: (v: string) => void }) {
  const cat = useCatalog();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {cat.elenco(tipo).map((c) => (
          <SelectItem key={c.codice} value={c.codice}>
            {c.etichetta}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
