import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileInBase64, proponiAssistente, type AssistenteRisposta, type AssistenteRichiesta } from "@/lib/assistente";

export function AssistenteBozza({
  tipo,
  contesto,
  onUsa,
  conVoce,
  conFoto,
}: {
  tipo: AssistenteRichiesta["tipo"];
  contesto?: Record<string, unknown>;
  onUsa: (bozza: AssistenteRisposta) => void;
  conVoce?: boolean;
  conFoto?: boolean;
}) {
  const [testo, setTesto] = useState("");
  const [foto, setFoto] = useState<{ mime: string; data: string }[]>([]);
  const [bozza, setBozza] = useState<AssistenteRisposta | null>(null);
  const [carico, setCarico] = useState(false);
  const [ascolto, setAscolto] = useState(false);

  async function proponi() {
    setCarico(true);
    try {
      const r = await proponiAssistente({ tipo, testo, immagini: foto, contesto });
      setBozza(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistente non disponibile");
    } finally {
      setCarico(false);
    }
  }

  function dettato() {
    const SR = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRec;
        webkitSpeechRecognition?: new () => SpeechRec;
      }
    ).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Il dettato non è disponibile in questo browser");
      return;
    }
    const rec = new SR();
    rec.lang = "it-IT";
    rec.interimResults = false;
    rec.onstart = () => setAscolto(true);
    rec.onend = () => setAscolto(false);
    rec.onerror = () => setAscolto(false);
    rec.onresult = (ev) => {
      const detto = [...ev.results].map((r) => r[0].transcript).join(" ");
      setTesto((prev) => (prev ? `${prev} ${detto}` : detto));
    };
    rec.start();
  }

  return (
    <div className="space-y-3 rounded-[19px] border border-border bg-card p-4 shadow-card">
      <p className="font-display text-sm font-bold">Assistente (bozza)</p>
      <p className="text-[10.5px] text-muted-foreground">
        {tipo === "segnalazione"
          ? "Voce o foto diventano una proposta. Non scrive in archivio finché non confermi."
          : "Proposta da rivedere. Non scrive in archivio finché non confermi."}
      </p>
      {tipo === "segnalazione" ? (
        <div className="space-y-2">
          <Label>Trascrizione o appunti</Label>
          <Textarea value={testo} onChange={(e) => setTesto(e.target.value)} placeholder="Dettato o note libere" />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {conVoce ? (
          <Button type="button" variant="outline" size="sm" onClick={dettato}>
            <Mic className="h-4 w-4" />
            {ascolto ? "Ascolto…" : "Dettato"}
          </Button>
        ) : null}
        {conFoto ? (
          <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border bg-card px-4 text-sm font-semibold">
            Foto per bozza
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFoto([await fileInBase64(f)]);
                toast.success("Foto pronta per la bozza (non in archivio)");
              }}
            />
          </label>
        ) : null}
        <Button type="button" size="sm" onClick={() => void proponi()} disabled={carico}>
          <Sparkles className="h-4 w-4" />
          {carico ? "Elaboro…" : "Proponi bozza"}
        </Button>
      </div>
      {bozza ? (
        <div className="space-y-2 rounded-[19px] bg-secondary/60 p-3">
          <p className="text-[10.5px] font-semibold text-muted-foreground">{bozza.avviso}</p>
          <p className="text-sm leading-relaxed">{bozza.testo}</p>
          {bozza.p ? (
            <p className="text-xs">
              P {bozza.p} · M {bozza.m} · R {bozza.r}
              {bozza.fattori ? ` · ${bozza.fattori}` : ""}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              onUsa(bozza);
              toast.success("Bozza copiata nei campi. Conferma tu il salvataggio.");
            }}
          >
            Usa questa bozza
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((ev: { results: { 0: { transcript: string } }[] }) => void) | null;
}
