import { NavLink, Outlet } from "react-router-dom";
import { Home, PlusCircle, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export function MobileShell() {
  const sezioni: { to: string; end: boolean; icona: LucideIcon; label: string }[] = [
    { to: "/app", end: true, icona: Home, label: "Home" },
    { to: "/app/nuova", end: false, icona: PlusCircle, label: "Nuova" },
    { to: "/app/profilo", end: false, icona: User, label: "Profilo" },
  ];

  return (
    <div className="tema-app relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden overscroll-none border-border bg-background text-foreground sm:border-x">
      <main className="flex flex-1 flex-col overflow-y-auto pt-[env(safe-area-inset-top)] pb-[calc(88px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(12px+env(safe-area-inset-bottom))]" aria-label="Navigazione">
        <ul className="pointer-events-auto grid grid-cols-3 items-center rounded-2xl border border-border/60 bg-card/95 px-2 py-1 shadow-elegant backdrop-blur-md">
          {sezioni.map(({ to, end, icona: Icona, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-11 flex-col items-center gap-[3px] py-2 text-[10.5px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-[27px] w-11 place-items-center rounded-lg transition-colors",
                        isActive && "bg-secondary",
                      )}
                    >
                      <Icona className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Toaster offset="calc(92px + env(safe-area-inset-bottom))" />
    </div>
  );
}
