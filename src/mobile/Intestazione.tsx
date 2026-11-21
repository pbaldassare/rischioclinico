import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, HeartPulse } from "lucide-react";

export function Intestazione({
  titolo,
  sottotitolo,
  indietro,
  azione,
}: {
  titolo: string;
  sottotitolo?: ReactNode;
  indietro?: boolean;
  azione?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-none items-center gap-2.5 px-4 pb-3 pt-2">
      {indietro ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className="grid h-8 w-8 flex-none place-items-center rounded-full border border-border bg-card text-muted-foreground"
        >
          <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
        </button>
      ) : (
        <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-primary/10 text-primary">
          <HeartPulse className="h-[18px] w-[18px]" aria-hidden />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[17px] font-bold leading-tight">{titolo}</h1>
        {sottotitolo ? (
          <div className="truncate text-[10.5px] font-semibold leading-tight text-muted-foreground">{sottotitolo}</div>
        ) : null}
      </div>
      {azione}
    </header>
  );
}
