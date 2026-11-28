import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Mic, PenLine, Sparkles, X } from "lucide-react";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda } from "@/mobile/atoms";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { haPrivilegio, unitaAssegnate } from "@/lib/livelli";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { fileInBase64, proponiAssistente, trascrivi } from "@/lib/assistente";
import { caricaAllegati, comprimiImmagine, fotogrammiVideo } from "@/lib/allegati";
import { cn } from "@/lib/utils";

type Danno = "nessuno" | "lieve" | "grave";
const DANNI: { codice: Danno; etichetta: string }[] = [
  { codice: "nessuno", etichetta: "Nessun danno" },
  { codice: "lieve", etichetta: "Danno lieve" },
  { codice: "grave", etichetta: "Danno grave" },
];
// Una scala sola per l'operatore; gravità ed esito del database ne derivano.
const DANNO_IN_CODICI: Record<Danno, { gravita: string; magnitudo: string }> = {
  nessuno: { gravita: "near_miss", magnitudo: "nessuno" },
  lieve: { gravita: "evento_avverso", magnitudo: "lieve" },
  grave: { gravita: "evento_avverso", magnitudo: "severo" },
};
// shortcut: i video partono interi, max 25 MB; oltre serve una compressione lato server
const MAX_VIDEO = 25 * 1024 * 1024;

export function PwaNuova() {
  const cat = useCatalog();
  const { profilo } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const assegnate = unitaAssegnate(profilo);
  const reparti = useMemo(() => cat.unita.filter((u) => assegnate.includes(u.id)), [cat.unita, assegnate]);

  // Raccolta
  const [passo, setPasso] = useState<"raccolta" | "revisione">("raccolta");
  const [testo, setTesto] = useState("");
  const [scrivo, setScrivo] = useState(false);
  const [media, setMedia] = useState<File[]>([]);
  const [ascolto, setAscolto] = useState<"no" | "registro" | "trascrivo">("no");
  const [elaboro, setElaboro] = useState(false);
  const registratore = useRef<MediaRecorder | null>(null);

  // Scheda
  const [unitaId, setUnitaId] = useState(reparti[0]?.id ?? "");
  const [dataOra, setDataOra] = useState(() => oraLocale());
  const [dinamica, setDinamica] = useState("");
  const [tipo, setTipo] = useState("altro");
  const [danno, setDanno] = useState<Danno>("nessuno");
  const [fase, setFase] = useState("assistenza");
  const [luogo, setLuogo] = useState("reparto_degenza");
  const [sentinella, setSentinella] = useState(false);
  const [tipoSentinella, setTipoSentinella] = useState("9");
  const [impatto, setImpatto] = useState("");
  const [dettagli, setDettagli] = useState(false);
  const [avvisoIa, setAvvisoIa] = useState("");
  const [invio, setInvio] = useState(false);

  const unitaScelta = reparti.find((u) => u.id === unitaId) ?? reparti[0];

  async function dettato() {
    if (ascolto === "registro") {
      registratore.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Il dettato non è disponibile in questo browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const pezzi: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) pezzi.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setAscolto("trascrivo");
        try {
          const detto = await trascrivi(new Blob(pezzi, { type: rec.mimeType || "audio/webm" }));
          if (detto) setTesto((prev) => (prev ? `${prev} ${detto}` : detto));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Trascrizione non riuscita");
        } finally {
          setAscolto("no");
        }
      };
      registratore.current = rec;
      rec.start();
      setAscolto("registro");
    } catch {
      toast.error("Microfono non disponibile");
    }
  }

  function aggiungiMedia(files: FileList | null) {
    const nuovi = [...(files ?? [])].filter((f) => {
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO) {
        toast.error(`${f.name}: video oltre 25 MB, registrane uno più corto`);
        return false;
      }
      return true;
    });
    if (nuovi.length) setMedia((prev) => [...prev, ...nuovi]);
  }

  async function creaScheda() {
    if (!testo.trim() && media.length === 0) {
      toast.error("Racconta, fotografa o scrivi qualcosa prima");
      return;
    }
    setElaboro(true);
    try {
      const immagini: { mime: string; data: string }[] = [];
      for (const f of media) {
        if (f.type.startsWith("image/")) immagini.push(await fileInBase64(await comprimiImmagine(f, 1280)));
        else if (f.type.startsWith("video/")) immagini.push(...(await fotogrammiVideo(f)));
      }
      const r = await proponiAssistente({
        tipo: "segnalazione",
        testo,
        immagini: immagini.slice(0, 6),
        contesto: {
          reparto: unitaScelta?.nome,
          elenchi: {
            tipi: cat.elenco("tipo_evento_ir").map((c) => ({ codice: c.codice, etichetta: c.etichetta })),
            fasi: cat.elenco("fase_cura").map((c) => ({ codice: c.codice, etichetta: c.etichetta })),
            luoghi: cat.elenco("luogo").map((c) => ({ codice: c.codice, etichetta: c.etichetta })),
            sentinelle: cat.tipiSentinella.map((t) => ({ codice: t.codice, etichetta: t.etichetta })),
          },
        },
      });
      setDinamica(r.testo);
      const s = r.scheda ?? {};
      if (s.tipo_evento) setTipo(s.tipo_evento);
      if (s.danno) setDanno(s.danno);
      if (s.fase_cura) setFase(s.fase_cura);
      setLuogo(s.luogo ?? luogoDaReparto(unitaScelta?.nome));
      setSentinella(Boolean(s.sentinella));
      if (s.tipo_sentinella) setTipoSentinella(String(s.tipo_sentinella));
      setAvvisoIa(r.avviso);
      setPasso("revisione");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistente non disponibile");
    } finally {
      setElaboro(false);
    }
  }

  function compilaAMano() {
    setDinamica(testo);
    setLuogo(luogoDaReparto(unitaScelta?.nome));
    setAvvisoIa("");
    setPasso("revisione");
  }

  async function invia() {
    if (!haPrivilegio(profilo, "segnalare")) {
      toast.error("L’ASL non ti ha dato il privilegio di segnalare");
      return;
    }
    if (!dinamica.trim()) {
      toast.error("Descrivi la dinamica");
      return;
    }
    if (!unitaScelta || !assegnate.includes(unitaScelta.id)) {
      toast.error("Nessun reparto assegnato: chiedi all’ASL");
      return;
    }
    setInvio(true);
    const codici = DANNO_IN_CODICI[danno];
    const { data, error } = await supabase
      .from("segnalazioni")
      .insert({
        azienda_id: profilo?.azienda_id ?? cat.aziende[0]?.id,
        presidio_id: unitaScelta.presidio_id,
        unita_operativa_id: unitaScelta.id,
        luogo_codice: luogo,
        data_ora_evento: new Date(dataOra).toISOString(),
        tipo_evento_codice: tipo,
        gravita_codice: sentinella ? "evento_sentinella" : codici.gravita,
        magnitudo_codice: codici.magnitudo,
        fase_cura_codice: fase,
        sentinella,
        tipo_sentinella_codice: sentinella ? Number(tipoSentinella) : null,
        anonima: false,
        stato: "inviata",
        dinamica,
        impatto: impatto || null,
        inserito_da: profilo?.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      setInvio(false);
      toast.error(error?.message ?? "Invio non riuscito");
      return;
    }
    try {
      if (media.length) await caricaAllegati(data.id, media);
      toast.success("Segnalazione inviata");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scheda salvata, allegati non caricati");
    } finally {
      qc.invalidateQueries({ queryKey: ["segnalazioni"] });
      setInvio(false);
      navigate("/app");
    }
  }

  if (passo === "raccolta") {
    return (
      <div className="flex flex-1 flex-col px-4 pb-6">
        <Intestazione titolo="Nuova segnalazione" sottotitolo="Racconta cos’è successo, al resto pensa l’assistente" indietro />

        <div className="grid grid-cols-2 gap-3">
          <Azione
            attiva={ascolto === "registro"}
            disabled={ascolto === "trascrivo"}
            onClick={() => void dettato()}
            icona={<Mic className="h-7 w-7" aria-hidden />}
            titolo={ascolto === "registro" ? "Ferma" : ascolto === "trascrivo" ? "Trascrivo…" : "Racconta a voce"}
            nota={ascolto === "registro" ? "Sto registrando" : "Parla come a un collega"}
          />
          <label className="contents">
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                aggiungiMedia(e.target.files);
                e.target.value = "";
              }}
            />
            <Azione
              icona={<Camera className="h-7 w-7" aria-hidden />}
              titolo="Foto o video"
              nota="Dalla fotocamera, video brevi"
              come="span"
            />
          </label>
        </div>

        {media.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {media.map((f, i) => (
              <li key={`${f.name}-${i}`} className="relative">
                <Anteprima file={f} />
                <button
                  type="button"
                  aria-label={`Togli ${f.name}`}
                  onClick={() => setMedia((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {testo || scrivo ? (
          <div className="mt-4 space-y-2">
            <Label>Il tuo racconto</Label>
            <Textarea
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Cosa è successo, dove, quando, a chi"
              className="min-h-[140px]"
              autoFocus={scrivo && !testo}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setScrivo(true)} className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary">
            <PenLine className="h-4 w-4" aria-hidden />
            Preferisci scrivere?
          </button>
        )}

        <button
          type="button"
          onClick={() => void creaScheda()}
          disabled={elaboro || ascolto !== "no"}
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-display text-base font-bold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {elaboro ? "L’assistente sta compilando…" : "Crea la scheda con l’assistente"}
        </button>
        <button type="button" onClick={compilaAMano} className="mt-3 text-center text-xs font-semibold text-muted-foreground">
          Compila la scheda a mano
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione titolo="Controlla e invia" sottotitolo={avvisoIa || "Scheda compilata a mano"} indietro />
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void invia();
        }}
      >
        <Campo label="Dinamica">
          <Textarea value={dinamica} onChange={(e) => setDinamica(e.target.value)} required className="min-h-[150px]" />
        </Campo>

        <Campo label="Tipologia evento">
          <Elenco tipo="tipo_evento_ir" value={tipo} onChange={setTipo} />
        </Campo>

        <Campo label="Gravità">
          <div className="grid grid-cols-3 gap-2">
            {DANNI.map((d) => (
              <button
                key={d.codice}
                type="button"
                onClick={() => setDanno(d.codice)}
                className={cn(
                  "min-h-11 rounded-lg border px-2 font-display text-xs font-bold transition-colors",
                  danno === d.codice ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                )}
              >
                {d.etichetta}
              </button>
            ))}
          </div>
        </Campo>

        <div className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-card px-4">
          <Label htmlFor="sentinella">Evento sentinella</Label>
          <Switch id="sentinella" checked={sentinella} onCheckedChange={setSentinella} />
        </div>
        {sentinella ? (
          <Campo label="Tipo sentinella">
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

        <Campo label="Data e ora evento">
          <Input type="datetime-local" value={dataOra} onChange={(e) => setDataOra(e.target.value)} />
        </Campo>

        {reparti.length > 1 ? (
          <Campo label="Reparto">
            <Select value={unitaScelta?.id} onValueChange={setUnitaId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reparti.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome} · {cat.nomePresidio(u.presidio_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
        ) : (
          <p className="text-[10.5px] text-muted-foreground">
            {unitaScelta?.nome ?? "Nessun reparto"} · {cat.nomePresidio(unitaScelta?.presidio_id)}
          </p>
        )}

        {media.length ? (
          <p className="text-[10.5px] text-muted-foreground">
            {media.length} {media.length === 1 ? "allegato" : "allegati"} in invio con la scheda.
          </p>
        ) : null}

        <button type="button" onClick={() => setDettagli((v) => !v)} className="text-xs font-semibold text-primary">
          {dettagli ? "Nascondi dettagli" : "Altri dettagli (fase, luogo, impatto)"}
        </button>
        {dettagli ? (
          <Scheda className="space-y-3 p-4">
            <Campo label="Fase di cura">
              <Elenco tipo="fase_cura" value={fase} onChange={setFase} />
            </Campo>
            <Campo label="Luogo">
              <Elenco tipo="luogo" value={luogo} onChange={setLuogo} />
            </Campo>
            <Campo label="Impatto (facoltativo)">
              <Textarea value={impatto} onChange={(e) => setImpatto(e.target.value)} />
            </Campo>
          </Scheda>
        ) : null}

        <button
          type="submit"
          disabled={invio}
          className="flex min-h-14 w-full items-center justify-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {invio ? "Invio…" : "Invia segnalazione"}
        </button>
        <button type="button" onClick={() => setPasso("raccolta")} className="w-full text-center text-xs font-semibold text-muted-foreground">
          Torna al racconto
        </button>
      </form>
    </div>
  );
}

function luogoDaReparto(nome?: string) {
  const n = (nome ?? "").toLowerCase();
  if (n.includes("pronto soccorso")) return "pronto_soccorso";
  if (n.includes("intensiva")) return "terapia_intensiva";
  if (n.includes("ambulator")) return "ambulatorio";
  return "reparto_degenza";
}

function oraLocale() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Azione({
  icona,
  titolo,
  nota,
  attiva,
  disabled,
  onClick,
  come = "button",
}: {
  icona: ReactNode;
  titolo: string;
  nota: string;
  attiva?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  come?: "button" | "span";
}) {
  const classi = cn(
    "flex min-h-[124px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center shadow-card transition-colors",
    attiva ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-card text-foreground",
    disabled && "opacity-50",
  );
  const dentro = (
    <>
      <span className={cn("grid h-12 w-12 place-items-center rounded-full", attiva ? "bg-white/20" : "bg-primary/10 text-primary")}>{icona}</span>
      <span className="font-display text-sm font-bold">{titolo}</span>
      <span className={cn("text-[10.5px]", attiva ? "text-destructive-foreground/80" : "text-muted-foreground")}>{nota}</span>
    </>
  );
  if (come === "span") return <span className={classi}>{dentro}</span>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classi}>
      {dentro}
    </button>
  );
}

function Anteprima({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  if (file.type.startsWith("video/")) return <video src={url} muted className="h-16 w-16 rounded-xl border border-border object-cover" />;
  return <img src={url} alt={file.name} className="h-16 w-16 rounded-xl border border-border object-cover" />;
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
