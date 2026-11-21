import { Link } from "react-router-dom";
import { Marchio } from "@/components/Marchio";
import { PulsanteInstalla } from "@/components/PulsanteInstalla";

export function Installa() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <Marchio grande sottotitolo="Installa l’app sul telefono" />
        </div>

        <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
          <p className="mb-4 text-sm text-muted-foreground">
            Aggiungi Rischio clinico alla schermata Home. Si apre come app, senza barra del browser, sulla stessa
            origine pubblica.
          </p>
          <PulsanteInstalla className="mb-0" />
          <p className="mt-4 text-[10.5px] text-muted-foreground">
            Dopo l’installazione l’app parte da <code>/app</code>. Serve un accesso con email e password.
          </p>
          <Link
            to="/"
            className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-border bg-card font-semibold"
          >
            Torna all’accesso
          </Link>
        </div>
      </div>
    </div>
  );
}
