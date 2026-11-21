import { useNavigate } from "react-router-dom";
import { Marchio } from "@/components/Marchio";
import { useAuth } from "@/lib/auth";
import { ETICHETTE_RUOLO } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Caricamento } from "@/mobile/atoms";

export function Login() {
  const { profili, caricamento, entra, homeDopoLogin } = useAuth();
  const navigate = useNavigate();

  if (caricamento) return <Caricamento etichetta="Carico i profili demo…" />;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <Marchio grande sottotitolo="Piattaforma rischio clinico-assicurativo" />
        </div>

        <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            Accesso demo: gli utenti Auth non sono ancora collegati. Scegli un profilo (niente password). Il secondo
            fattore arriverà con il login reale.
          </p>
          <ul className="mt-4 space-y-2">
            {profili.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    entra(p.id);
                    navigate(homeDopoLogin(p));
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-[19px] border border-border bg-card px-4 py-3 text-left shadow-card transition-all duration-300 ease-smooth hover:shadow-lg",
                  )}
                >
                  <span>
                    <span className="block font-display text-sm font-bold">{p.nome}</span>
                    <span className="block text-xs text-muted-foreground">{p.email}</span>
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10.5px] font-bold text-primary">
                    {ETICHETTE_RUOLO[p.ruolo]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
