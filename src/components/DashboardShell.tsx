import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface VoceMenu {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  marchio: ReactNode;
  voci: VoceMenu[];
  attiva: string;
  onSeleziona: (id: string) => void;
  email?: string | null;
  onEsci: () => void;
  etichettaEsci: string;
  titolo: string;
  descrizione?: ReactNode;
  avviso?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  marchio,
  voci,
  attiva,
  onSeleziona,
  email,
  onEsci,
  etichettaEsci,
  titolo,
  descrizione,
  avviso,
  children,
}: Props) {
  const [pannelloAperto, setPannelloAperto] = useState(false);
  const contenuto = useRef<HTMLElement>(null);
  useEffect(() => {
    contenuto.current?.scrollTo({ top: 0 });
  }, [attiva]);

  const navigazione = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {voci.map((voce) => {
        const Icona = voce.icon;
        return (
          <button
            key={voce.id}
            onClick={() => {
              onSeleziona(voce.id);
              setPannelloAperto(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 ease-smooth",
              attiva === voce.id
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            )}
          >
            <Icona className="h-4 w-4 shrink-0" />
            <span className="truncate text-left">{voce.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const piede = (
    <div className="border-t border-border/70 p-4">
      {email ? <div className="mb-2 truncate text-sm text-muted-foreground">{email}</div> : null}
      <Button variant="outline" size="sm" onClick={onEsci} className="w-full">
        {etichettaEsci}
      </Button>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <aside className="hidden w-64 flex-col border-r border-border/70 bg-card md:flex">
        <div className="border-b border-border/70 p-6">{marchio}</div>
        {navigazione}
        {piede}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border/70 bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden">
          <Sheet open={pannelloAperto} onOpenChange={setPannelloAperto}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" aria-label={titolo}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[280px] flex-col gap-0 p-0 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
            >
              <SheetTitle className="sr-only">{titolo}</SheetTitle>
              <div className="border-b border-border/70 p-6">{marchio}</div>
              {navigazione}
              {piede}
            </SheetContent>
          </Sheet>
          <h2 className="min-w-0 flex-1 truncate text-base font-bold">{titolo}</h2>
        </div>

        <main ref={contenuto} className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <div className="p-4 sm:p-6 lg:p-8">
            {avviso}
            <div className="mb-6 hidden md:block lg:mb-8">
              <h2 className="mb-2 text-2xl font-bold lg:text-3xl">{titolo}</h2>
              {descrizione ? <p className="text-muted-foreground">{descrizione}</p> : null}
            </div>
            {descrizione ? <p className="mb-5 text-sm text-muted-foreground md:hidden">{descrizione}</p> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
