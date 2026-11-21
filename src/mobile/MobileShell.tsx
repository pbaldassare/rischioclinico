import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, Home, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchSegnalazioni } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

const SEZIONI = [
  { to: "/app", end: true, icona: Home, label: "Home" },
  { to: "/app/nuova", end: false, icona: PlusCircle, label: "Nuova" },
  { to: "/app/coda", end: false, icona: ClipboardList, label: "Coda" },
  { to: "/app/profilo", end: false, icona: User, label: "Profilo" },
] as const;

export function MobileShell() {
  const { profilo } = useAuth();
  const coda = useQuery({
    queryKey: ["segnalazioni", "coda-badge", profilo?.azienda_id],
    queryFn: () => fetchSegnalazioni({ aziendaId: profilo?.azienda_id }),
    enabled: !!profilo,
  });
  const daPrendere = (coda.data ?? []).filter((s) => s.stato === "inviata").length;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden overscroll-none border-border bg-background text-foreground sm:border-x">
      <main className="flex flex-1 flex-col overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>

      <nav className="flex-none border-t border-border bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Navigazione">
        <ul className="grid grid-cols-4 items-center px-2">
          {SEZIONI.map(({ to, end, icona: Icona, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-11 flex-col items-center gap-[3px] py-2 font-display text-[9.5px] font-bold transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-[27px] w-11 place-items-center rounded-full transition-colors",
                        isActive && "bg-primary/12",
                      )}
                    >
                      <Icona className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    {label === "Coda" && daPrendere > 0 ? (
                      <span className="absolute right-3 top-0 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-destructive px-1 text-[8.5px] font-bold text-destructive-foreground">
                        {daPrendere > 9 ? "9+" : daPrendere}
                      </span>
                    ) : null}
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Toaster offset="calc(66px + env(safe-area-inset-bottom))" />
    </div>
  );
}
