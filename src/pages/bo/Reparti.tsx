import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { ChevronDown, ChevronRight, UserPlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { eAdmin, ePresidio } from "@/lib/livelli";
import { aggiungiAssegnazione, creaReparto, fetchOperatori, fetchSegnalazioni, rimuoviAssegnazione } from "@/lib/queries";
import { AttivitaOspedale } from "@/components/AttivitaOspedale";
import type { Profile, UnitaOperativa } from "@/lib/types";
import { DISCIPLINE } from "@/lib/reparti";

const AREE = [...new Set(DISCIPLINE.map((d) => d.area))];

/** Reparti per ospedale, con gli operatori collegati e i loro compiti. L'ASL vede la propria, l'Admin tutte. */
export function BoReparti() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const qc = useQueryClient();
  const admin = eAdmin(profilo);
  const [aziendaId, setAziendaId] = useState(profilo?.azienda_id ?? cat.aziende[0]?.id ?? "");
  const aziendaScelta = admin ? aziendaId || cat.aziende[0]?.id : profilo?.azienda_id;
  const presidi = cat.presidi.filter((p) => !aziendaScelta || p.azienda_id === aziendaScelta);
  const [presidioId, setPresidioId] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [nome, setNome] = useState("");
  const scelta = DISCIPLINE.find((d) => d.codice === disciplina);
  const nomeNuovo = disciplina === "altro" ? nome.trim() : (scelta?.nome ?? "");
  const presidioNuovo = presidi.some((p) => p.id === presidioId) ? presidioId : (presidi[0]?.id ?? "");

  const operatori = useQuery({ queryKey: ["operatori"], queryFn: fetchOperatori });
  const seg = useQuery({ queryKey: ["segnalazioni", { aziendaId: aziendaScelta }], queryFn: () => fetchSegnalazioni({ aziendaId: aziendaScelta }) });
  const operatoriAsl = (operatori.data ?? []).filter((o) => !aziendaScelta || o.azienda_id === aziendaScelta);
  const segPerReparto = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of seg.data ?? []) if (s.unita_operativa_id) m.set(s.unita_operativa_id, (m.get(s.unita_operativa_id) ?? 0) + 1);
    return m;
  }, [seg.data]);

  const crea = useMutation({
    mutationFn: () => creaReparto({ presidio_id: presidioNuovo, nome: nomeNuovo, codice_disciplina: scelta?.codice }),
    onSuccess: () => {
      toast.success("Reparto creato");
      setNome("");
      setDisciplina("");
      void qc.invalidateQueries({ queryKey: ["unita"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!admin && !ePresidio(profilo)) return <Navigate to="/bo" replace />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ogni ASL ha i suoi reparti. Un reparto può avere più operatori e un operatore può stare su più reparti: chi è collegato può segnalare lì dall’app.
      </p>

      {admin ? (
        <div className="max-w-sm space-y-2">
          <Label>ASL</Label>
          <Select value={aziendaScelta} onValueChange={setAziendaId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cat.aziende.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {presidi.map((p) => {
        const reparti = cat.unita.filter((u) => u.presidio_id === p.id);
        return (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-xl">
                {p.nome}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {reparti.length} {reparti.length === 1 ? "reparto" : "reparti"}
                  {p.posti_letto ? ` · ${p.posti_letto} posti letto` : ""}
                </span>
              </CardTitle>
              <AttivitaOspedale presidio={p} />
            </CardHeader>
            <CardContent className="space-y-2">
              {reparti.length === 0 ? <p className="text-sm text-muted-foreground">Nessun reparto: aggiungilo qui sotto.</p> : null}
              {reparti.map((u) => (
                <Reparto key={u.id} unita={u} operatori={operatoriAsl} segnalazioni={segPerReparto.get(u.id) ?? 0} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nuovo reparto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Ospedale</Label>
            <Select value={presidioNuovo || undefined} onValueChange={setPresidioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presidi.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reparto</Label>
            <Select value={disciplina || undefined} onValueChange={setDisciplina}>
              <SelectTrigger>
                <SelectValue placeholder="Scegli dall’elenco" />
              </SelectTrigger>
              <SelectContent>
                {AREE.map((area) => (
                  <div key={area}>
                    <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{area}</p>
                    {DISCIPLINE.filter((d) => d.area === area).map((d) => (
                      <SelectItem key={d.codice} value={d.codice}>
                        {d.nome}
                      </SelectItem>
                    ))}
                  </div>
                ))}
                <SelectItem value="altro">Altro: scrivo io il nome</SelectItem>
              </SelectContent>
            </Select>
            {disciplina === "altro" ? <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome del reparto" /> : null}
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={!presidioNuovo || !nomeNuovo || crea.isPending} onClick={() => crea.mutate()}>
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Reparto({ unita, operatori, segnalazioni }: { unita: UnitaOperativa; operatori: Profile[]; segnalazioni: number }) {
  const qc = useQueryClient();
  const [aperto, setAperto] = useState(false);
  const [nuovo, setNuovo] = useState("");
  const collegati = operatori
    .map((o) => ({ o, a: (o.assegnazioni ?? []).find((a) => a.unita_operativa_id === unita.id) }))
    .filter((x): x is { o: Profile; a: NonNullable<typeof x.a> } => Boolean(x.a));
  const liberi = operatori.filter((o) => !collegati.some((c) => c.o.id === o.id));
  const ricarica = () => void qc.invalidateQueries({ queryKey: ["operatori"] });

  const aggiungi = useMutation({
    mutationFn: () => aggiungiAssegnazione(nuovo, unita.id, ["segnalare"]),
    onSuccess: () => {
      setNuovo("");
      ricarica();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const togli = useMutation({
    mutationFn: (id: string) => rimuoviAssegnazione(id),
    onSuccess: ricarica,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-border">
      <button type="button" onClick={() => setAperto((v) => !v)} className="flex w-full items-center gap-3 p-3 text-left">
        {aperto ? <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden /> : <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
        <span className="flex-1 font-semibold">{unita.nome}</span>
        <span className="text-xs text-muted-foreground">
          {collegati.length} {collegati.length === 1 ? "operatore" : "operatori"} · {segnalazioni} {segnalazioni === 1 ? "segnalazione" : "segnalazioni"}
        </span>
      </button>
      {aperto ? (
        <div className="space-y-2 border-t border-border p-3">
          {collegati.length === 0 ? <p className="text-sm text-muted-foreground">Nessun operatore collegato.</p> : null}
          {collegati.map(({ o, a }) => (
            <div key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <span className="min-w-[160px] font-semibold">
                {[o.nome, o.cognome].filter(Boolean).join(" ")}
                <span className="block text-xs font-normal text-muted-foreground">{o.email}</span>
              </span>
              <button
                type="button"
                onClick={() => togli.mutate(a.id)}
                aria-label={`Scollega ${o.nome} da ${unita.nome}`}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-destructive"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Scollega
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2 pt-1">
            <div className="min-w-[220px] flex-1 space-y-1">
              <Label className="text-xs">Collega un operatore</Label>
              <Select value={nuovo || undefined} onValueChange={setNuovo}>
                <SelectTrigger>
                  <SelectValue placeholder={liberi.length ? "Scegli…" : "Tutti gli operatori sono già collegati"} />
                </SelectTrigger>
                <SelectContent>
                  {liberi.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {[o.nome, o.cognome].filter(Boolean).join(" ")} · {o.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" disabled={!nuovo || aggiungi.isPending} onClick={() => aggiungi.mutate()}>
              <UserPlus className="h-4 w-4" />
              Collega
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
