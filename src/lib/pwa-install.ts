export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type StatoInstallazione = {
  disponibile: boolean;
  standalone: boolean;
  ios: boolean;
};

type Ascoltatore = () => void;

const ascoltatori = new Set<Ascoltatore>();

let deferred: BeforeInstallPromptEvent | null = null;
let stato: StatoInstallazione = {
  disponibile: false,
  standalone: false,
  ios: false,
};

function pubblica(parziale: Partial<StatoInstallazione>) {
  stato = { ...stato, ...parziale };
  ascoltatori.forEach((fn) => fn());
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const safari = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(media || safari);
}

function inizializza() {
  if (typeof window === "undefined") return;
  pubblica({ standalone: isStandalone(), ios: isIos(), disponibile: Boolean(deferred) });

  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    deferred = evento as BeforeInstallPromptEvent;
    pubblica({ disponibile: true, standalone: isStandalone() });
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    pubblica({ disponibile: false, standalone: true });
  });
}

inizializza();

export function subscribeInstallazione(ascoltatore: Ascoltatore) {
  ascoltatori.add(ascoltatore);
  return () => {
    ascoltatori.delete(ascoltatore);
  };
}

export function getStatoInstallazione(): StatoInstallazione {
  return stato;
}

export async function chiediInstallazioneNativa(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const evento = deferred;
  deferred = null;
  pubblica({ disponibile: false });
  await evento.prompt();
  const scelta = await evento.userChoice;
  if (scelta.outcome === "accepted") pubblica({ standalone: isStandalone() });
  return scelta.outcome;
}
