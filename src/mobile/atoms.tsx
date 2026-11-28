import { ReactNode } from "react";
import { HeartPulse, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TitoloSezione({ children }: { children: ReactNode }) {
  return <h2 className="mx-0.5 mt-1 font-display text-[13px] font-bold">{children}</h2>;
}

export function Caricamento({ etichetta = "Caricamento…" }: { etichetta?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
      <p className="text-xs text-muted-foreground">{etichetta}</p>
    </div>
  );
}

export function Vuoto({
  titolo,
  testo,
  azione,
}: {
  titolo: string;
  testo: string;
  azione?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <HeartPulse className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-base font-bold">{titolo}</h2>
      <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-muted-foreground">{testo}</p>
      {azione ? <div className="mt-5 w-full max-w-[240px]">{azione}</div> : null}
    </div>
  );
}

export function Scheda({ children, className, ...resto }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-3 shadow-card", className)} {...resto}>
      {children}
    </div>
  );
}
