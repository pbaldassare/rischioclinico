import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

export function Marchio({
  sottotitolo,
  grande,
}: {
  sottotitolo?: string;
  grande?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-primary/10 text-primary",
          grande ? "h-16 w-16 rounded-2xl shadow-glow" : "h-10 w-10",
        )}
      >
        <HeartPulse className={grande ? "h-8 w-8" : "h-5 w-5"} aria-hidden />
      </span>
      <div className="min-w-0">
        <h1 className={cn("truncate font-display font-bold", grande ? "text-3xl sm:text-4xl" : "text-lg")}>
          {grande ? (
            <span className="bg-gradient-primary bg-clip-text text-transparent">Rischio clinico</span>
          ) : (
            "Rischio clinico"
          )}
        </h1>
        {sottotitolo ? <p className="truncate text-xs text-muted-foreground">{sottotitolo}</p> : null}
      </div>
    </div>
  );
}
