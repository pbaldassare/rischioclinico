import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Check, Circle, Mic, PenLine, Sparkles, Square, X } from "lucide-react";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda } from "@/mobile/atoms";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
// shortcut: i video partono interi; 10 MB è il limite del bucket rc-allegati (circa 30-60 s da telefono), per andare oltre serve comprimere lato server
const MAX_VIDEO = 10 * 1024 * 1024;
const GUIDA_KEY = "rc.guida-voce-vista";
const LIMITE_DOLCE_S = 120;

// La traccia del racconto: cinque cose da dire. Le regex servono solo alle spunte, non alla scheda.
const TRACCIA = [
  { k: "cosa", etichetta: "Cosa è successo", re: /\S+(\s+\S+){5,}/ },
  { k: "quando", etichetta: "Quando: giorno e ora", re: /\b(ieri|oggi|stanotte|stamattina|stasera|pomeriggio|mattin|sera|notte|turno|alle?\s?\d|ore\s?\d|\d{1,2}[:.]\d{2}|minuti fa|poco fa)/i },
  { k: "dove", etichetta: "Dove: reparto, stanza", re: /\b(reparto|stanza|letto|corridoio|bagno|sala|pronto soccorso|ambulator|ascensore|corsia|terapia intensiva|degenza|camera|ingresso|triage|parcheggio)/i },
  { k: "chi", etichetta: "A chi, senza nomi", re: /\b(paziente|signor|operator|infermier|medic|oss\b|visitator|collega|bambin|anzian|degente|utente|famili)/i },
  { k: "esito", etichetta: "Come è andata a finire", re: /\b(nessun danno|senza danno|sta bene|nulla di grave|ferit|frattur|trauma|ematoma|trasferit|ortopedia|ricover|deced|mort|dolor|lesion|medicat|sutur|radiograf|tac\b|dimess|tutto ok|sotto controllo)/i },
] as const;
type Voce = (typeof TRACCIA)[number]["k"];
const ESEMPIO =
  "Stanotte verso le tre la paziente del letto 4 è scivolata andando in bagno, ha battuto l’anca, l’abbiamo portata in ortopedia.";

const GUIDATO: { k: Voce; etichetta: string; placeholder: string }[] = [
  { k: "cosa", etichetta: "Cosa è successo", placeholder: "Es. la paziente è scivolata andando in bagno" },
  { k: "quando", etichetta: "Quando", placeholder: "Es. stanotte verso le tre" },
  { k: "dove", etichetta: "Dove", placeholder: "Es. corridoio del reparto, letto 4" },
  { k: "chi", etichetta: "A chi", placeholder: "Es. paziente, operatore, visitatore (senza nomi)" },
  { k: "esito", etichetta: "Come è andata a finire", placeholder: "Es. ha battuto l’anca, portata in ortopedia" },
];

interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
}

export function PwaNuova() {
  const cat = useCatalog();
  const { profilo } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const assegnate = unitaAssegnate(profilo);
  const reparti = useMemo(() => cat.unita.filter((u) => assegnate.includes(u.id)), [cat.unita, assegnate]);

  // Raccolta
  const [passo, setPasso] = useState<"raccolta" | "riepilogo" | "revisione">("raccolta");
  const [guidaAperta, setGuidaAperta] = useState(false);
  const [nonMostrare, setNonMostrare] = useState(false);
  const [testo, setTesto] = useState("");
  const [parziale, setParziale] = useState("");
  const [secondi, setSecondi] = useState(0);
  const [scrivo, setScrivo] = useState(false);
  const [guidato, setGuidato] = useState<Record<Voce, string>>({ cosa: "", quando: "", dove: "", chi: "", esito: "" });
  const [media, setMedia] = useState<File[]>([]);
  const [ascolto, setAscolto] = useState<"no" | "registro" | "trascrivo">("no");
  const [elaboro, setElaboro] = useState(false);
  const registratore = useRef<MediaRecorder | null>(null);
  const riconoscitore = useRef<SpeechRec | null>(null);
  const timer = useRef<number | null>(null);

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
  const [proposti, setProposti] = useState<Set<string>>(new Set());
  const [raccontoOriginale, setRaccontoOriginale] = useState("");
  const [invio, setInvio] = useState(false);

  const unitaScelta = reparti.find((u) => u.id === unitaId) ?? reparti[0];
  const testoGuidato = GUIDATO.filter((g) => guidato[g.k].trim())
    .map((g) => `${g.etichetta}: ${guidato[g.k].trim()}`)
    .join(". ");
  const testoCompleto = [testo.trim(), testoGuidato].filter(Boolean).join("\n");
  const copertura = useMemo(() => {
    const t = `${testoCompleto} ${parziale}`;
    return TRACCIA.map((v) => ({ ...v, ok: v.re.test(t) }));
  }, [testoCompleto, parziale]);
  const mancanti = copertura.filter((v) => !v.ok);

  useEffect(() => () => fermaTimer(), []);

  function fermaTimer() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  }

  function spegni(k: string) {
    setProposti((prev) => {
      if (!prev.has(k)) return prev;
      const n = new Set(prev);
      n.delete(k);
      return n;
    });
  }

  function raccontaAVoce() {
    if (ascolto === "registro") {
      registratore.current?.stop();
      return;
    }
    if (localStorage.getItem(GUIDA_KEY)) void avviaRegistrazione();
    else setGuidaAperta(true);
  }

  async function avviaRegistrazione() {
    setGuidaAperta(false);
    if (nonMostrare) localStorage.setItem(GUIDA_KEY, "1");
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
        fermaTimer();
        riconoscitore.current?.stop();
        riconoscitore.current = null;
        setParziale("");
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
      setSecondi(0);
      timer.current = window.setInterval(() => setSecondi((s) => s + 1), 1000);
      avviaSpunteDalVivo();
      setAscolto("registro");
    } catch {
      toast.error("Microfono non disponibile");
    }
  }

  // Riconoscimento del browser solo per le spunte mentre parla: il testo vero arriva da Whisper.
  function avviaSpunteDalVivo() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    try {
      const r = new SR();
      r.lang = "it-IT";
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (ev) => setParziale(Array.from(ev.results, (res) => res[0]?.transcript ?? "").join(" "));
      r.onerror = () => undefined;
      r.start();
      riconoscitore.current = r;
    } catch {
      riconoscitore.current = null;
    }
  }

  function aggiungiMedia(files: FileList | null) {
    const nuovi = [...(files ?? [])].filter((f) => {
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO) {
        toast.error(`Video troppo grande (${Math.round(f.size / 1024 / 1024)} MB): massimo 10 MB, circa 30-60 secondi. Registrane uno più corto`);
        return false;
      }
      return true;
    });
    if (nuovi.length) setMedia((prev) => [...prev, ...nuovi]);
  }

  async function creaScheda() {
    if (!testoCompleto && media.length === 0) {
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
        testo: testoCompleto,
        immagini: immagini.slice(0, 6),
        contesto: {
          reparto: unitaScelta?.nome,
          adesso: new Date().toISOString(),
          elenchi: {
            tipi: cat.elenco("tipo_evento_ir").map((c) => ({ codice: c.codice, etichetta: c.etichetta })),
            fasi: cat.elenco("fase_cura").map((c) => ({ codice: c.codice, etichetta: c.etichetta })),
            luoghi: cat.elenco("luogo").map((c) => ({ codice: c.codice, etichetta: c.etichetta })),
            sentinelle: cat.tipiSentinella.map((t) => ({ codice: t.codice, etichetta: t.descrizione ? `${t.etichetta} (${t.descrizione})` : t.etichetta })),
          },
        },
      });
      const s = r.scheda ?? {};
      const p = new Set<string>(["dinamica"]);
      setDinamica(r.testo);
      if (s.tipo_evento) {
        setTipo(s.tipo_evento);
        p.add("tipo");
      }
      if (s.danno) {
        setDanno(s.danno);
        p.add("danno");
      }
      if (s.fase_cura) {
        setFase(s.fase_cura);
        p.add("fase");
      }
      setLuogo(s.luogo ?? luogoDaReparto(unitaScelta?.nome));
      if (s.luogo) p.add("luogo");
      setSentinella(Boolean(s.sentinella));
      if (s.sentinella) p.add("sentinella");
      if (s.tipo_sentinella) setTipoSentinella(String(s.tipo_sentinella));
      if (s.data_ora && !Number.isNaN(new Date(s.data_ora).getTime())) {
        setDataOra(oraLocale(new Date(s.data_ora)));
        p.add("dataOra");
      }
      setProposti(p);
      setRaccontoOriginale(testoCompleto);
      setAvvisoIa(r.avviso);
      setPasso("riepilogo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistente non disponibile");
    } finally {
      setElaboro(false);
    }
  }

  function compilaAMano() {
    setDinamica(testoCompleto);
    setLuogo(luogoDaReparto(unitaScelta?.nome));
    setProposti(new Set());
    setRaccontoOriginale("");
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

  const quandoDetto = new Date(dataOra).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });

  if (passo === "raccolta") {
    const registro = ascolto === "registro";
    const haRacconto = Boolean(testo.trim());
    return (
      <div className="flex flex-1 flex-col px-4 pb-6">
        <Intestazione titolo="Nuova segnalazione" sottotitolo="Racconta cos’è successo, al resto pensa l’assistente" indietro />

        {registro ? (
          <Scheda className="space-y-4 border-primary/40 p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" aria-hidden />
                Sto ascoltando
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{mmss(secondi)}</span>
            </div>
            <Traccia voci={copertura} />
            {secondi >= LIMITE_DOLCE_S ? (
              <p className="text-xs text-warning-ink">Racconto lungo: ferma pure, potrai aggiungere un pezzo dopo.</p>
            ) : null}
            <button
              type="button"
              onClick={() => registratore.current?.stop()}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-destructive font-display text-base font-bold text-destructive-foreground"
            >
              <Square className="h-5 w-5" aria-hidden />
              Ferma e trascrivi
            </button>
          </Scheda>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Azione
              disabled={ascolto === "trascrivo"}
              onClick={raccontaAVoce}
              icona={<Mic className="h-7 w-7" aria-hidden />}
              titolo={ascolto === "trascrivo" ? "Trascrivo…" : haRacconto ? "Aggiungi un pezzo" : "Racconta a voce"}
              nota={haRacconto ? "Si accoda al racconto" : "Parla come a un collega"}
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
              <Azione icona={<Camera className="h-7 w-7" aria-hidden />} titolo="Foto o video" nota="Dalla fotocamera, video fino a 10 MB" come="span" />
            </label>
          </div>
        )}

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

        {haRacconto && !registro ? (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label>Il tuo racconto, correggi se serve</Label>
              <Textarea value={testo} onChange={(e) => setTesto(e.target.value)} className="min-h-[140px]" />
            </div>
            <Traccia voci={copertura} compatta />
            {mancanti.length ? (
              <p className="text-xs text-muted-foreground">
                Non hai detto {mancanti.map((v) => v.etichetta.split(":")[0].toLowerCase()).join(", ")}. Puoi aggiungere un pezzo a voce o scriverlo qui sopra.
                {mancanti.some((v) => v.k === "quando") ? ` Se non lo dici, metto adesso: ${quandoDetto}.` : ""}
              </p>
            ) : (
              <p className="text-xs text-success-ink">Hai detto tutto quello che serve.</p>
            )}
          </div>
        ) : null}

        {!registro ? (
          scrivo ? (
            <Scheda className="mt-4 space-y-3 p-4">
              <p className="font-display text-sm font-bold">Scrivi in cinque righe</p>
              {GUIDATO.map((g) => (
                <div key={g.k} className="space-y-1">
                  <Label htmlFor={`g-${g.k}`}>{g.etichetta}</Label>
                  <Input
                    id={`g-${g.k}`}
                    value={guidato[g.k]}
                    placeholder={g.placeholder}
                    onChange={(e) => setGuidato((prev) => ({ ...prev, [g.k]: e.target.value }))}
                  />
                </div>
              ))}
            </Scheda>
          ) : (
            <button type="button" onClick={() => setScrivo(true)} className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary">
              <PenLine className="h-4 w-4" aria-hidden />
              {haRacconto ? "Aggiungi qualcosa per iscritto" : "Preferisci scrivere?"}
            </button>
          )
        ) : null}

        {!registro ? (
          <>
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
          </>
        ) : null}

        <Sheet open={guidaAperta} onOpenChange={setGuidaAperta}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(16px+env(safe-area-inset-bottom))]">
            <SheetTitle className="font-display text-lg font-bold">Racconta come a un collega</SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">Bastano trenta secondi. Di’ queste cinque cose, nell’ordine che vuoi:</p>
            <ol className="mt-3 space-y-2">
              {TRACCIA.map((v, i) => (
                <li key={v.k} className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-secondary font-display text-xs font-bold text-primary">{i + 1}</span>
                  {v.etichetta}
                </li>
              ))}
            </ol>
            <blockquote className="mt-4 rounded-lg bg-muted p-3 text-sm italic leading-relaxed">«{ESEMPIO}»</blockquote>
            <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={nonMostrare} onChange={(e) => setNonMostrare(e.target.checked)} className="h-4 w-4 accent-primary" />
              Non mostrare più
            </label>
            <button
              type="button"
              onClick={() => void avviaRegistrazione()}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-display text-base font-bold text-primary-foreground shadow-glow"
            >
              <Mic className="h-5 w-5" aria-hidden />
              Inizia a registrare
            </button>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  if (passo === "riepilogo") {
    const righe = [
      cat.etichetta("tipo_evento_ir", tipo),
      quandoDetto,
      `${unitaScelta?.nome ?? ""} · ${cat.etichetta("luogo", luogo)}`,
      `${DANNI.find((d) => d.codice === danno)?.etichetta ?? ""}${sentinella ? " · evento sentinella" : ""}`,
    ];
    return (
      <div className="flex flex-1 flex-col px-4 pb-6">
        <Intestazione titolo="Ho capito così" sottotitolo="Dimmi se è giusto" indietro />
        <Scheda className="space-y-3 p-4">
          <ul className="space-y-2">
            {righe.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">{dinamica}</p>
        </Scheda>
        <button
          type="button"
          onClick={() => setPasso("revisione")}
          className="mt-5 flex min-h-14 w-full items-center justify-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground shadow-glow"
        >
          Sì, apri la scheda
        </button>
        <button type="button" onClick={() => setPasso("raccolta")} className="mt-3 text-center text-sm font-semibold text-primary">
          No, correggo il racconto
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
        <Campo label="Dinamica" proposto={proposti.has("dinamica")}>
          <Textarea
            value={dinamica}
            onChange={(e) => {
              setDinamica(e.target.value);
              spegni("dinamica");
            }}
            required
            className="min-h-[150px]"
          />
          {raccontoOriginale ? (
            <p className="text-xs text-muted-foreground">
              Hai detto: «{raccontoOriginale.length > 180 ? `${raccontoOriginale.slice(0, 180)}…` : raccontoOriginale}»
            </p>
          ) : null}
        </Campo>

        <Campo label="Tipologia evento" proposto={proposti.has("tipo")}>
          <Elenco
            tipo="tipo_evento_ir"
            value={tipo}
            onChange={(v) => {
              setTipo(v);
              spegni("tipo");
            }}
          />
        </Campo>

        <Campo label="Gravità" proposto={proposti.has("danno")}>
          <div className="grid grid-cols-3 gap-2">
            {DANNI.map((d) => (
              <button
                key={d.codice}
                type="button"
                onClick={() => {
                  setDanno(d.codice);
                  spegni("danno");
                }}
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
          <Label htmlFor="sentinella" className="inline-flex items-center gap-2">
            Evento sentinella
            {proposti.has("sentinella") ? <Proposto /> : null}
          </Label>
          <Switch
            id="sentinella"
            checked={sentinella}
            onCheckedChange={(v) => {
              setSentinella(v);
              spegni("sentinella");
            }}
          />
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

        <Campo label="Data e ora evento" proposto={proposti.has("dataOra")}>
          <Input
            type="datetime-local"
            value={dataOra}
            onChange={(e) => {
              setDataOra(e.target.value);
              spegni("dataOra");
            }}
          />
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
          <p className="text-xs text-muted-foreground">
            {unitaScelta?.nome ?? "Nessun reparto"} · {cat.nomePresidio(unitaScelta?.presidio_id)}
          </p>
        )}

        {media.length ? (
          <p className="text-xs text-muted-foreground">
            {media.length} {media.length === 1 ? "allegato" : "allegati"} in invio con la scheda.
          </p>
        ) : null}

        <button type="button" onClick={() => setDettagli((v) => !v)} className="text-xs font-semibold text-primary">
          {dettagli ? "Nascondi dettagli" : "Altri dettagli (fase, luogo, impatto)"}
        </button>
        {dettagli ? (
          <Scheda className="space-y-3 p-4">
            <Campo label="Fase di cura" proposto={proposti.has("fase")}>
              <Elenco
                tipo="fase_cura"
                value={fase}
                onChange={(v) => {
                  setFase(v);
                  spegni("fase");
                }}
              />
            </Campo>
            <Campo label="Luogo" proposto={proposti.has("luogo")}>
              <Elenco
                tipo="luogo"
                value={luogo}
                onChange={(v) => {
                  setLuogo(v);
                  spegni("luogo");
                }}
              />
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

function oraLocale(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mmss(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Traccia({ voci, compatta }: { voci: { k: string; etichetta: string; ok: boolean }[]; compatta?: boolean }) {
  return (
    <ul className={cn(compatta ? "flex flex-wrap gap-x-3 gap-y-1" : "space-y-1.5")}>
      {voci.map((v) => (
        <li key={v.k} className={cn("inline-flex items-center gap-1.5 text-xs", v.ok ? "text-success-ink" : "text-muted-foreground")}>
          {v.ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Circle className="h-3.5 w-3.5" aria-hidden />}
          {compatta ? v.etichetta.split(":")[0] : v.etichetta}
        </li>
      ))}
    </ul>
  );
}

function Proposto() {
  return <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-primary">proposto</span>;
}

function Azione({
  icona,
  titolo,
  nota,
  disabled,
  onClick,
  come = "button",
}: {
  icona: ReactNode;
  titolo: string;
  nota: string;
  disabled?: boolean;
  onClick?: () => void;
  come?: "button" | "span";
}) {
  const classi = cn(
    "flex min-h-[124px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center text-foreground shadow-card transition-colors",
    disabled && "opacity-50",
  );
  const dentro = (
    <>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">{icona}</span>
      <span className="font-display text-sm font-bold">{titolo}</span>
      <span className="text-xs text-muted-foreground">{nota}</span>
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

function Campo({ label, proposto, children }: { label: string; proposto?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="inline-flex items-center gap-2">
        {label}
        {proposto ? <Proposto /> : null}
      </Label>
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
