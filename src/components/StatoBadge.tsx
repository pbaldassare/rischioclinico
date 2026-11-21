import { AlertTriangle, Check, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ETICHETTE_STATO_FDR, ETICHETTE_STATO_SEGNALAZIONE, ETICHETTE_STATO_SINISTRO, etichetta } from "@/lib/labels";

const CLASSI: Record<string, string> = {
  inviata: "bg-info/10 text-info-ink border-info/20",
  in_lavorazione: "bg-warning/10 text-warning-ink border-warning/20",
  completata: "bg-success/10 text-success-ink border-success/20",
  aperto: "bg-info/10 text-info-ink border-info/20",
  in_riserva: "bg-warning/10 text-warning-ink border-warning/20",
  liquidato: "bg-success/10 text-success-ink border-success/20",
  in_causa: "bg-danger/10 text-danger-ink border-danger/20",
  chiuso_senza_seguito: "bg-muted text-muted-foreground border-border",
  bozza: "bg-muted text-muted-foreground border-border",
  in_corso: "bg-warning/10 text-warning-ink border-warning/20",
  validata: "bg-success/10 text-success-ink border-success/20",
  near_miss: "bg-success/10 text-success-ink border-success/20",
  evento_senza_danno: "bg-warning/10 text-warning-ink border-warning/20",
  evento_avverso: "bg-danger/10 text-danger-ink border-danger/20",
  evento_sentinella: "bg-destructive/10 text-destructive-ink border-destructive/20",
};

const ICONE: Record<string, typeof Clock> = {
  inviata: Send,
  in_lavorazione: Clock,
  completata: Check,
  in_riserva: AlertTriangle,
  in_causa: AlertTriangle,
  evento_sentinella: AlertTriangle,
};

export function StatoBadge({
  stato,
  mappa = ETICHETTE_STATO_SEGNALAZIONE,
}: {
  stato?: string | null;
  mappa?: Record<string, string>;
}) {
  if (!stato) return null;
  const Icona = ICONE[stato] ?? Clock;
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1 rounded-full border px-2.5 py-0.5 font-display text-[10.5px] font-bold",
        CLASSI[stato] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      <Icona className="h-3 w-3" aria-hidden />
      {etichetta(mappa, stato)}
    </span>
  );
}

export function pillSinistro(stato?: string | null) {
  return <StatoBadge stato={stato} mappa={ETICHETTE_STATO_SINISTRO} />;
}

export function pillFdr(stato?: string | null) {
  return <StatoBadge stato={stato} mappa={ETICHETTE_STATO_FDR} />;
}
