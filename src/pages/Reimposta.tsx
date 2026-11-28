import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Marchio } from "@/components/Marchio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/sonner";

/** Arrivo dal link di recupero: Supabase apre la sessione dall'URL, qui si sceglie la password nuova. */
export function Reimposta() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [password, setPassword] = useState("");
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setPronto(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") setPronto(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return void toast.error("Almeno 8 caratteri");
    setInvio(true);
    const { error } = await supabase.auth.updateUser({ password });
    setInvio(false);
    if (error) return void toast.error(error.message);
    toast.success("Password aggiornata");
    navigate("/");
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex justify-center">
        <Marchio grande sottotitolo="Nuova password" />
      </div>
      <form onSubmit={(e) => void salva(e)} className="space-y-4 rounded-3xl border-2 border-border bg-card/80 p-6">
        {pronto ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">Scegli la nuova password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={invio}>
              {invio ? "Salvo…" : "Salva e entra"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Link non valido o scaduto. Richiedi un nuovo link dalla pagina di accesso.</p>
        )}
      </form>
      <Toaster />
    </div>
  );
}
