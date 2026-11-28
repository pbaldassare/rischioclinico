import { useRef, useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileInBase64, proponiAssistente, trascrivi, type AssistenteRisposta, type AssistenteRichiesta } from "@/lib/assistente";
import { comprimiImmagine } from "@/lib/allegati";

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
  const [ascolto, setAscolto] = useState<"no" | "registro" | "trascrivo">("no");
  const registratore = useRef<MediaRecorder | null>(null);

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

  async function dettato() {
    if (ascolto === "registro") {
      registratore.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Il dettato non e' disponibile in questo browser");
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
          <Button
            type="button"
            variant={ascolto === "registro" ? "destructive" : "outline"}
            size="sm"
            onClick={() => void dettato()}
            disabled={ascolto === "trascrivo"}
          >
            <Mic className="h-4 w-4" />
            {ascolto === "registro" ? "Ferma e trascrivi" : ascolto === "trascrivo" ? "Trascrivo…" : "Dettato"}
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
                setFoto([await fileInBase64(await comprimiImmagine(f, 1280))]);
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
