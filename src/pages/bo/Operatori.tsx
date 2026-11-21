import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { ePresidio, PRIVILEGI_OPERATORE } from "@/lib/livelli";
import { creaUtentePiattaforma, fetchOperatori, sostituisciAssegnazioni } from "@/lib/queries";
import type { Privilegio, Profile } from "@/lib/types";

export function BoOperatori() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["operatori"], queryFn: fetchOperatori, enabled: ePresidio(profilo) });
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  const crea = useMutation({
    mutationFn: () =>
      creaUtentePiattaforma({
        nome,
        email,
        ruolo: "operatore",
        azienda_id: profilo?.azienda_id,
        presidio_id: profilo?.presidio_id ?? cat.presidi[0]?.id,
      }),
    onSuccess: () => {
      toast.success("Operatore creato per l’app. Password: DemoRischio2026!");
      setNome("");
      setEmail("");
      void qc.invalidateQueries({ queryKey: ["operatori"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ePresidio(profilo)) return <Navigate to="/bo" replace />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gli operatori usano solo l’app, sul reparto che assegni, con i privilegi che dai tu.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nuovo operatore</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!nome.trim() || !email.trim() || crea.isPending}
              onClick={() => crea.mutate()}
            >
              Crea per l’app
            </Button>
          </div>
        </CardContent>
      </Card>
      {(q.data ?? []).map((op) => (
        <SchedaOperatore key={op.id} operatore={op} />
      ))}
    </div>
  );
}

function SchedaOperatore({ operatore }: { operatore: Profile }) {
  const cat = useCatalog();
  const qc = useQueryClient();
  const iniziali = useMemo(() => {
    const map: Record<string, Privilegio[]> = {};
    for (const a of operatore.assegnazioni ?? []) map[a.unita_operativa_id] = a.privilegi;
    return map;
  }, [operatore.assegnazioni]);
  const [scelte, setScelte] = useState<Record<string, Privilegio[]>>(iniziali);

  const salva = useMutation({
    mutationFn: () =>
      sostituisciAssegnazioni(
        operatore.id,
        Object.entries(scelte)
          .filter(([, priv]) => priv.length)
          .map(([unita_operativa_id, privilegi]) => ({ unita_operativa_id, privilegi })),
      ),
    onSuccess: () => {
      toast.success("Assegnazioni aggiornate");
      void qc.invalidateQueries({ queryKey: ["operatori"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleReparto(id: string, on: boolean) {
    setScelte((prev) => {
      const next = { ...prev };
      if (on) next[id] = prev[id]?.length ? prev[id] : ["segnalare", "coda"];
      else delete next[id];
      return next;
    });
  }

  function togglePriv(id: string, p: Privilegio, on: boolean) {
    setScelte((prev) => {
      const cur = new Set(prev[id] ?? []);
      if (on) cur.add(p);
      else cur.delete(p);
      return { ...prev, [id]: [...cur] as Privilegio[] };
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {operatore.nome}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{operatore.email}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cat.unita.map((u) => {
          const attivo = u.id in scelte;
          return (
            <div key={u.id} className="rounded-[19px] border border-border p-3">
              <label className="flex items-center gap-2 font-semibold">
                <Checkbox checked={attivo} onCheckedChange={(v) => toggleReparto(u.id, v === true)} />
                {u.nome}
                <span className="text-xs font-normal text-muted-foreground">{cat.nomePresidio(u.presidio_id)}</span>
              </label>
              {attivo ? (
                <div className="mt-2 flex flex-wrap gap-3 pl-6 text-sm">
                  {PRIVILEGI_OPERATORE.map((p) => (
                    <label key={p.codice} className="flex items-center gap-2">
                      <Checkbox
                        checked={(scelte[u.id] ?? []).includes(p.codice)}
                        onCheckedChange={(v) => togglePriv(u.id, p.codice, v === true)}
                      />
                      {p.etichetta}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        <Button onClick={() => salva.mutate()} disabled={salva.isPending}>
          Salva assegnazioni
        </Button>
      </CardContent>
    </Card>
  );
}
