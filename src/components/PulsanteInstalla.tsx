import { useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import {
  chiediInstallazioneNativa,
  getStatoInstallazione,
  subscribeInstallazione,
} from "@/lib/pwa-install";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SERVER: ReturnType<typeof getStatoInstallazione> = {
  disponibile: false,
  standalone: false,
  ios: false,
};

export function PulsanteInstalla({
  variante = "blocco",
  className,
}: {
  variante?: "blocco" | "login";
  className?: string;
}) {
  const stato = useSyncExternalStore(subscribeInstallazione, getStatoInstallazione, () => SERVER);
  const [aperto, setAperto] = useState(false);
  const [attesa, setAttesa] = useState(false);

  if (stato.standalone) {
    if (variante === "login") return null;
    return (
      <p className={cn("mb-3 text-center text-[10.5px] font-semibold text-muted-foreground", className)}>
        App già sulla schermata Home
      </p>
    );
  }

  async function onInstalla() {
    if (stato.ios || !stato.disponibile) {
      setAperto(true);
      return;
    }
    setAttesa(true);
    try {
      const esito = await chiediInstallazioneNativa();
      if (esito === "unavailable") setAperto(true);
    } finally {
      setAttesa(false);
    }
  }

  const etichetta = stato.ios ? "Aggiungi alla schermata Home" : "Installa l’app";

  return (
    <>
      {variante === "login" ? (
        <button
          type="button"
          id="installa-app"
          onClick={() => void onInstalla()}
          disabled={attesa}
          className={cn(
            "mb-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-display text-sm font-bold text-primary-foreground shadow-glow",
            className,
          )}
        >
          <Download className="h-4 w-4" aria-hidden />
          {attesa ? "Installazione…" : etichetta}
        </button>
      ) : (
        <section
          className={cn("mb-4 rounded-[19px] border border-primary/30 bg-card p-4 shadow-card", className)}
          aria-labelledby="installa-titolo"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="installa-titolo" className="font-display text-[13px] font-bold leading-tight">
                Installa l’app
              </h2>
              <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">
                Aggiungi Rischio clinico alla schermata Home. Funziona da Chrome su Android e da Safari su iPhone.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="installa-app"
            onClick={() => void onInstalla()}
            disabled={attesa}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-display text-sm font-bold text-primary-foreground shadow-glow"
          >
            <Download className="h-4 w-4" aria-hidden />
            {attesa ? "Installazione…" : etichetta}
          </button>
        </section>
      )}

      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Aggiungi alla schermata Home</DialogTitle>
          </DialogHeader>
          {stato.ios ? <IstruzioniIos /> : <IstruzioniBrowser />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function IstruzioniIos() {
  return (
    <ol className="space-y-3 text-sm text-foreground">
      <li className="flex gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
          1
        </span>
        <p>
          Tocca <Share className="mx-0.5 inline h-4 w-4 text-primary" aria-hidden /> <strong>Condividi</strong> in
          Safari (il quadrato con la freccia in alto).
        </p>
      </li>
      <li className="flex gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
          2
        </span>
        <p>
          Scorri e scegli <strong>Aggiungi a Home</strong>.
        </p>
      </li>
      <li className="flex gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
          3
        </span>
        <p>Conferma: l’icona teal si apre a tutto schermo, senza barra del browser.</p>
      </li>
    </ol>
  );
}

function IstruzioniBrowser() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        Se Chrome non ha ancora aperto la finestra nativa, installa così:
      </p>
      <ol className="space-y-3 text-foreground">
        <li className="flex gap-3">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
            1
          </span>
          <p>
            Su <strong>Android / Chrome</strong>: menu ⋮ in alto a destra, poi <strong>Installa app</strong> (o
            l’icona di installazione nella barra indirizzi).
          </p>
        </li>
        <li className="flex gap-3">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
            2
          </span>
          <p>
            Su <strong>iPhone</strong> apri questo sito in Safari, tocca Condividi, poi{" "}
            <strong>Aggiungi a Home</strong>.
          </p>
        </li>
      </ol>
    </div>
  );
}
