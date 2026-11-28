import { NavLink, Outlet } from "react-router-dom";
import { PlusCircle, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export function MobileShell() {
  const sezioni: { to: string; end: boolean; icona: LucideIcon; label: string }[] = [
    { to: "/app", end: true, icona: PlusCircle, label: "Nuova" },
    { to: "/app/profilo", end: false, icona: User, label: "Profilo" },
  ];

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden overscroll-none border-border bg-background text-foreground sm:border-x">
      <main className="flex flex-1 flex-col overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>

      <nav className="flex-none border-t border-border bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Navigazione">
        <ul className="grid grid-cols-2 items-center px-2">
          {sezioni.map(({ to, end, icona: Icona, label }) => (
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
