import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCatalog } from "@/lib/catalog";
import { creaAzienda, creaPresidio, creaUtentePiattaforma, fetchUtentiPresidio } from "@/lib/queries";
import { eAdmin } from "@/lib/livelli";
import { useAuth } from "@/lib/auth";
import { Navigate } from "react-router-dom";

export function BoAnagrafica() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const qc = useQueryClient();
  const gestori = useQuery({ queryKey: ["utenti-presidio"], queryFn: fetchUtentiPresidio, enabled: eAdmin(profilo) });

  const [aslNome, setAslNome] = useState("");
  const [aslTipo, setAslTipo] = useState("asl");
  const [ospAzienda, setOspAzienda] = useState("");
  const [ospNome, setOspNome] = useState("");
  const [ospPosti, setOspPosti] = useState("");
  const [utNome, setUtNome] = useState("");
  const [utEmail, setUtEmail] = useState("");
  const [utAzienda, setUtAzienda] = useState("");

  const nuovaAsl = useMutation({
    mutationFn: () => creaAzienda({ nome: aslNome, tipo: aslTipo }),
    onSuccess: () => {
      toast.success("ASL creata");
      setAslNome("");
      void qc.invalidateQueries({ queryKey: ["aziende"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nuovoOsp = useMutation({
    mutationFn: () =>
      creaPresidio({
        azienda_id: ospAzienda,
        nome: ospNome,
        posti_letto: ospPosti ? Number(ospPosti) : null,
      }),
    onSuccess: () => {
      toast.success("Ospedale / presidio creato");
      setOspNome("");
      setOspPosti("");
      void qc.invalidateQueries({ queryKey: ["presidi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nuovoGestore = useMutation({
    mutationFn: () =>
      creaUtentePiattaforma({
        nome: utNome,
        email: utEmail,
        ruolo: "presidio",
        azienda_id: utAzienda,
      }),
    onSuccess: () => {
      toast.success("Utente ASL creato. Password: DemoRischio2026!");
      setUtNome("");
      setUtEmail("");
      void qc.invalidateQueries({ queryKey: ["utenti-presidio"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!eAdmin(profilo)) return <Navigate to="/bo" replace />;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        L’amministrazione crea le ASL e gli ospedali. Ogni ASL gestisce da sola i propri reparti e operatori.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">ASL e ospedali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cat.aziende.map((a) => (
            <div key={a.id} className="rounded-[19px] border border-border p-4">
              <p className="font-display font-bold">{a.nome}</p>
              <p className="text-xs text-muted-foreground">
                {a.tipo.toUpperCase()}
                {a.codice_sis ? ` · SIS ${a.codice_sis}` : ""}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {cat.presidi
                  .filter((p) => p.azienda_id === a.id)
                  .map((p) => (
                    <li key={p.id}>
                      {p.nome}
                      {p.posti_letto ? ` · ${p.posti_letto} posti letto` : ""}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nuova ASL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Campo label="Nome">
              <Input value={aslNome} onChange={(e) => setAslNome(e.target.value)} />
            </Campo>
            <Campo label="Tipo">
              <Select value={aslTipo} onValueChange={setAslTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asl">ASL</SelectItem>
                  <SelectItem value="asp">ASP</SelectItem>
                  <SelectItem value="ao">AO</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
            <Button disabled={!aslNome.trim() || nuovaAsl.isPending} onClick={() => nuovaAsl.mutate()}>
              Crea ASL
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nuovo ospedale / presidio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Campo label="ASL">
              <Select value={ospAzienda || undefined} onValueChange={setOspAzienda}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli ASL" />
                </SelectTrigger>
                <SelectContent>
                  {cat.aziende.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Nome">
              <Input value={ospNome} onChange={(e) => setOspNome(e.target.value)} />
            </Campo>
            <Campo label="Posti letto">
              <Input type="number" value={ospPosti} onChange={(e) => setOspPosti(e.target.value)} />
            </Campo>
            <Button disabled={!ospAzienda || !ospNome.trim() || nuovoOsp.isPending} onClick={() => nuovoOsp.mutate()}>
              Crea ospedale
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Utenti ASL / presidio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ASL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(gestori.data ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{cat.nomeAzienda(u.azienda_id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo label="Nome">
              <Input value={utNome} onChange={(e) => setUtNome(e.target.value)} />
            </Campo>
            <Campo label="Email">
              <Input type="email" value={utEmail} onChange={(e) => setUtEmail(e.target.value)} />
            </Campo>
            <Campo label="ASL">
              <Select value={utAzienda || undefined} onValueChange={setUtAzienda}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli ASL" />
                </SelectTrigger>
                <SelectContent>
                  {cat.aziende.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
          </div>
          <Button
            disabled={!utNome.trim() || !utEmail.trim() || !utAzienda || nuovoGestore.isPending}
            onClick={() => nuovoGestore.mutate()}
          >
            Crea utente ASL
          </Button>
          <p className="text-[10.5px] text-muted-foreground">Password iniziale: DemoRischio2026!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
