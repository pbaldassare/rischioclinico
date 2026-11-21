import { useState } from "react";
import { Marchio } from "@/components/Marchio";
import { useAuth } from "@/lib/auth";
import { Caricamento } from "@/mobile/atoms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PulsanteInstalla } from "@/components/PulsanteInstalla";
import { Link } from "react-router-dom";

const DEMO = [
  { email: "admin@demo.asl", livello: "Admin — tutte le ASL, statistiche, sinistri" },
  { email: "referente@demo.asl", livello: "ASL / presidio — ASP Messina" },
  { email: "sinistri@demo.asl", livello: "ASL / presidio — AO Papardo" },
  { email: "operatore.ps@demo.asl", livello: "Operatore — PWA Pronto soccorso Taormina" },
];

export function Login() {
  const { caricamento, accedi } = useAuth();
  const [email, setEmail] = useState("operatore.ps@demo.asl");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);

  if (caricamento) return <Caricamento etichetta="Verifico la sessione…" />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    try {
      await accedi(email, password);
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Accesso non riuscito");
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <Marchio grande sottotitolo="Piattaforma rischio clinico-assicurativo" />
        </div>

        <PulsanteInstalla variante="login" />
        <p className="mb-4 text-center text-[10.5px] text-muted-foreground">
          <Link to="/installa" className="font-semibold text-primary underline-offset-4 hover:underline">
            Pagina di installazione
          </Link>
        </p>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-4 rounded-3xl border-2 border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl"
        >
          <p className="text-sm text-muted-foreground">
            Tre livelli: Admin, ASL/presidio, Operatore. Accesso con email e password su Supabase Auth.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {errore ? <p className="text-sm text-destructive">{errore}</p> : null}
          <Button type="submit" className="w-full" disabled={invio}>
            {invio ? "Accesso…" : "Entra"}
          </Button>
          <p className="text-[10.5px] text-muted-foreground">Utenti demo (stessa password):</p>
          <ul className="space-y-1 text-[10.5px] text-muted-foreground">
            {DEMO.map((d) => (
              <li key={d.email}>
                <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => setEmail(d.email)}>
                  <span className="font-semibold text-foreground">{d.email}</span>
                  <span className="block">{d.livello}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[10.5px] text-muted-foreground">Password unica demo: DemoRischio2026!</p>
        </form>
      </div>
    </div>
  );
}
