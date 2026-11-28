import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda } from "@/mobile/atoms";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import { comprimiImmagine } from "@/lib/allegati";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PwaProfilo() {
  const { profilo, esci } = useAuth();
  const cat = useCatalog();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [nome, setNome] = useState(profilo?.nome ?? "");
  const [cognome, setCognome] = useState(profilo?.cognome ?? "");
  const [telefono, setTelefono] = useState(profilo?.telefono ?? "");
  const [password, setPassword] = useState("");
  const [attesa, setAttesa] = useState<"" | "dati" | "foto" | "password" | "recupero" | "elimina">("");
  const reparti = (profilo?.assegnazioni ?? []).map((a) => a.unita?.nome ?? cat.nomeUnita(a.unita_operativa_id));
  const iniziali = `${nome[0] ?? ""}${cognome[0] ?? ""}`.toUpperCase() || "?";

  async function salvaDati() {
    if (!profilo) return;
    setAttesa("dati");
    const { error } = await supabase
      .from("profiles")
      .update({ nome: nome.trim(), cognome: cognome.trim() || null, telefono: telefono.trim() || null })
      .eq("id", profilo.id);
    setAttesa("");
    if (error) return void toast.error(error.message);
    toast.success("Dati salvati");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function cambiaFoto(file?: File) {
    if (!file || !profilo) return;
    setAttesa("foto");
    try {
      const piccola = await comprimiImmagine(file, 512);
      const path = `${profilo.id}/foto.jpg`;
      const up = await supabase.storage.from("avatars").upload(path, piccola, { upsert: true, contentType: piccola.type });
      if (up.error) throw up.error;
      // Querystring con l'ora: il browser non tiene la foto vecchia in cache.
      const url = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      const { error } = await supabase.from("profiles").update({ foto_url: url }).eq("id", profilo.id);
      if (error) throw error;
      toast.success("Foto aggiornata");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Foto non caricata");
    } finally {
      setAttesa("");
    }
  }

  async function cambiaPassword() {
    if (password.length < 8) return void toast.error("Almeno 8 caratteri");
    setAttesa("password");
    const { error } = await supabase.auth.updateUser({ password });
    setAttesa("");
    if (error) return void toast.error(error.message);
    setPassword("");
    toast.success("Password cambiata");
  }

  async function recuperoViaEmail() {
    if (!profilo?.email) return;
    setAttesa("recupero");
    const { error } = await supabase.auth.resetPasswordForEmail(profilo.email, { redirectTo: `${window.location.origin}/reimposta` });
    setAttesa("");
    if (error) return void toast.error(error.message);
    toast.success(`Link inviato a ${profilo.email}`);
  }

  async function eliminaAccount() {
    if (!window.confirm("Eliminare il tuo account? Non si può annullare. Le segnalazioni già inviate restano, senza il tuo nome.")) return;
    if (!window.confirm("Conferma definitiva: elimino account e accesso.")) return;
    setAttesa("elimina");
    const { error } = await supabase.functions.invoke("elimina-account");
    setAttesa("");
    if (error) return void toast.error("Eliminazione non riuscita, riprova o chiedi all’ASL");
    await esci();
    navigate("/");
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione titolo="Profilo" sottotitolo={profilo?.email ?? ""} />

      <div className="flex flex-col items-center">
        <label className="relative cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => void cambiaFoto(e.target.files?.[0])} disabled={attesa === "foto"} />
          {profilo?.foto_url ? (
            <img src={profilo.foto_url} alt="" className="h-24 w-24 rounded-full border-2 border-border object-cover" />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">{iniziali}</span>
          )}
          <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
            <Camera className="h-4 w-4" aria-hidden />
          </span>
        </label>
        <p className="mt-2 text-[10.5px] text-muted-foreground">{attesa === "foto" ? "Carico la foto…" : "Tocca per cambiare la foto"}</p>
      </div>

      <Scheda className="mt-4 space-y-3 p-4">
        <p className="font-display text-sm font-bold">I tuoi dati</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cognome">Cognome</Label>
            <Input id="cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} autoComplete="family-name" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="telefono">Telefono</Label>
          <Input id="telefono" type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" />
        </div>
        <Button type="button" className="w-full" onClick={() => void salvaDati()} disabled={attesa === "dati" || !nome.trim()}>
          {attesa === "dati" ? "Salvo…" : "Salva dati"}
        </Button>
      </Scheda>

      <Scheda className="mt-3 p-4">
        <p className="font-display text-sm font-bold">Dove lavori</p>
        <p className="mt-1 text-[10.5px] text-muted-foreground">Li gestisce l’ASL: se cambiano, chiedi a loro.</p>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">ASL</dt>
            <dd className="text-right">{cat.nomeAzienda(profilo?.azienda_id)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Ospedale</dt>
            <dd className="text-right">{cat.nomePresidio(profilo?.presidio_id)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Reparti</dt>
            <dd className="text-right">{reparti.join(", ") || "—"}</dd>
          </div>
        </dl>
      </Scheda>

      <Scheda className="mt-3 space-y-3 p-4">
        <p className="font-display text-sm font-bold">Password</p>
        <div className="space-y-1">
          <Label htmlFor="nuova-password">Nuova password</Label>
          <Input id="nuova-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Almeno 8 caratteri" />
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={() => void cambiaPassword()} disabled={attesa === "password" || !password}>
          {attesa === "password" ? "Cambio…" : "Cambia password"}
        </Button>
        <button type="button" onClick={() => void recuperoViaEmail()} disabled={attesa === "recupero"} className="w-full text-center text-xs font-semibold text-primary">
          {attesa === "recupero" ? "Invio…" : "Oppure ricevi un link di recupero via email"}
        </button>
      </Scheda>

      <Button variant="outline" className="mt-4 w-full" onClick={() => void esci().then(() => navigate("/"))}>
        Esci
      </Button>
      <button type="button" onClick={() => void eliminaAccount()} disabled={attesa === "elimina"} className="mt-6 text-center text-xs font-semibold text-destructive">
        {attesa === "elimina" ? "Elimino…" : "Elimina il mio account"}
      </button>
    </div>
  );
}
