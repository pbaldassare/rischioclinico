import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCatalog } from "@/lib/catalog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  aggiornaAzienda,
  aggiornaPresidio,
  creaAzienda,
  creaPresidio,
  creaUtentePiattaforma,
  eliminaAzienda,
  eliminaPresidio,
  fetchUtentiPresidio,
} from "@/lib/queries";
import type { Azienda, Presidio } from "@/lib/types";
import { Campo, vuotoANull } from "@/components/Campi";
import { AttivitaOspedale } from "@/components/AttivitaOspedale";
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
  const [aslSis, setAslSis] = useState("");
  const [aslRegione, setAslRegione] = useState("");
  const [ospAzienda, setOspAzienda] = useState("");
  const [ospNome, setOspNome] = useState("");
  const [ospCodice, setOspCodice] = useState("");
  const [ospPosti, setOspPosti] = useState("");
  const [utNome, setUtNome] = useState("");
  const [utEmail, setUtEmail] = useState("");
  const [utAzienda, setUtAzienda] = useState("");

  const nuovaAsl = useMutation({
    mutationFn: () => creaAzienda({ nome: aslNome.trim(), tipo: aslTipo, codice_sis: aslSis.trim(), regione_codice: aslRegione.trim() }),
    onSuccess: () => {
      toast.success("ASL creata");
      setAslNome("");
      setAslSis("");
      setAslRegione("");
      void qc.invalidateQueries({ queryKey: ["aziende"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nuovoOsp = useMutation({
    mutationFn: () =>
      creaPresidio({
        azienda_id: ospAzienda,
        nome: ospNome.trim(),
        codice_struttura: ospCodice.trim(),
        posti_letto: ospPosti ? Number(ospPosti) : null,
      }),
    onSuccess: () => {
      toast.success("Ospedale / presidio creato");
      setOspNome("");
      setOspCodice("");
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.tipo.toUpperCase()}
                    {a.codice_sis ? ` · SIS ${a.codice_sis}` : ""}
                    {a.regione_codice ? ` · Regione ${a.regione_codice}` : ""}
                  </p>
                </div>
                <ModificaAsl azienda={a} />
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {cat.presidi
                  .filter((p) => p.azienda_id === a.id)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        {p.nome}
                        {p.codice_struttura ? ` · ${p.codice_struttura}` : ""}
                        {p.posti_letto ? ` · ${p.posti_letto} posti letto` : ""}
                      </span>
                      <span className="flex shrink-0">
                        <AttivitaOspedale presidio={p} />
                        <ModificaOspedale presidio={p} />
                      </span>
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
              <SelectTipo value={aslTipo} onChange={setAslTipo} />
            </Campo>
            <Campo label="Codice SIS">
              <Input value={aslSis} onChange={(e) => setAslSis(e.target.value)} />
            </Campo>
            <Campo label="Codice regione">
              <Input value={aslRegione} onChange={(e) => setAslRegione(e.target.value)} />
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
              <SelectAsl value={ospAzienda} onChange={setOspAzienda} />
            </Campo>
            <Campo label="Nome">
              <Input value={ospNome} onChange={(e) => setOspNome(e.target.value)} />
            </Campo>
            <Campo label="Codice struttura">
              <Input value={ospCodice} onChange={(e) => setOspCodice(e.target.value)} />
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
              <SelectAsl value={utAzienda} onChange={setUtAzienda} />
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


function SelectTipo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="asl">ASL</SelectItem>
        <SelectItem value="asp">ASP</SelectItem>
        <SelectItem value="ao">AO</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SelectAsl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cat = useCatalog();
  return (
    <Select value={value || undefined} onValueChange={onChange}>
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
  );
}


function useModifica(chiave: string, salva: () => Promise<void>, elimina: () => Promise<void>, chiudi: () => void) {
  const qc = useQueryClient();
  const fatto = (msg: string) => {
    toast.success(msg);
    chiudi();
    void qc.invalidateQueries({ queryKey: [chiave] });
  };
  const onError = (e: Error) => toast.error(e.message);
  return {
    salva: useMutation({ mutationFn: salva, onSuccess: () => fatto("Modifiche salvate"), onError }),
    elimina: useMutation({ mutationFn: elimina, onSuccess: () => fatto("Eliminato"), onError }),
  };
}

function ModificaAsl({ azienda }: { azienda: Azienda }) {
  const [aperto, setAperto] = useState(false);
  const [nome, setNome] = useState(azienda.nome);
  const [tipo, setTipo] = useState(azienda.tipo);
  const [sis, setSis] = useState(azienda.codice_sis ?? "");
  const [regione, setRegione] = useState(azienda.regione_codice ?? "");
  const m = useModifica(
    "aziende",
    () => aggiornaAzienda(azienda.id, { nome: nome.trim(), tipo, codice_sis: vuotoANull(sis), regione_codice: vuotoANull(regione) }),
    () => eliminaAzienda(azienda.id),
    () => setAperto(false),
  );

  function apri(v: boolean) {
    if (v) {
      setNome(azienda.nome);
      setTipo(azienda.tipo);
      setSis(azienda.codice_sis ?? "");
      setRegione(azienda.regione_codice ?? "");
    }
    setAperto(v);
  }

  return (
    <Dialog open={aperto} onOpenChange={apri}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Modifica
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifica ASL</DialogTitle>
        </DialogHeader>
        <Campo label="Nome">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </Campo>
        <Campo label="Tipo">
          <SelectTipo value={tipo} onChange={setTipo} />
        </Campo>
        <Campo label="Codice SIS">
          <Input value={sis} onChange={(e) => setSis(e.target.value)} />
        </Campo>
        <Campo label="Codice regione">
          <Input value={regione} onChange={(e) => setRegione(e.target.value)} />
        </Campo>
        <Azioni
          puoSalvare={!!nome.trim()}
          inCorso={m.salva.isPending || m.elimina.isPending}
          onSalva={() => m.salva.mutate()}
          onElimina={() => {
            if (window.confirm(`Eliminare l’ASL «${azienda.nome}»?`)) m.elimina.mutate();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ModificaOspedale({ presidio }: { presidio: Presidio }) {
  const [aperto, setAperto] = useState(false);
  const [aziendaId, setAziendaId] = useState(presidio.azienda_id);
  const [nome, setNome] = useState(presidio.nome);
  const [codice, setCodice] = useState(presidio.codice_struttura ?? "");
  const [posti, setPosti] = useState(presidio.posti_letto?.toString() ?? "");
  const m = useModifica(
    "presidi",
    () =>
      aggiornaPresidio(presidio.id, {
        azienda_id: aziendaId,
        nome: nome.trim(),
        codice_struttura: vuotoANull(codice),
        posti_letto: posti ? Number(posti) : null,
      }),
    () => eliminaPresidio(presidio.id),
    () => setAperto(false),
  );

  function apri(v: boolean) {
    if (v) {
      setAziendaId(presidio.azienda_id);
      setNome(presidio.nome);
      setCodice(presidio.codice_struttura ?? "");
      setPosti(presidio.posti_letto?.toString() ?? "");
    }
    setAperto(v);
  }

  return (
    <Dialog open={aperto} onOpenChange={apri}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Modifica
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifica ospedale</DialogTitle>
        </DialogHeader>
        <Campo label="ASL">
          <SelectAsl value={aziendaId} onChange={setAziendaId} />
        </Campo>
        <Campo label="Nome">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </Campo>
        <Campo label="Codice struttura">
          <Input value={codice} onChange={(e) => setCodice(e.target.value)} />
        </Campo>
        <Campo label="Posti letto">
          <Input type="number" min={0} value={posti} onChange={(e) => setPosti(e.target.value)} />
        </Campo>
        <Azioni
          puoSalvare={!!nome.trim() && !!aziendaId}
          inCorso={m.salva.isPending || m.elimina.isPending}
          onSalva={() => m.salva.mutate()}
          onElimina={() => {
            if (window.confirm(`Eliminare l’ospedale «${presidio.nome}»?`)) m.elimina.mutate();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Azioni(props: { puoSalvare: boolean; inCorso: boolean; onSalva: () => void; onElimina: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
      <Button variant="destructive" disabled={props.inCorso} onClick={props.onElimina}>
        Elimina
      </Button>
      <Button disabled={!props.puoSalvare || props.inCorso} onClick={props.onSalva}>
        Salva
      </Button>
    </div>
  );
}
