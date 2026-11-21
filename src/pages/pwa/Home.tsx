import { Link } from "react-router-dom";
import { ClipboardPlus, FileWarning, HeartPulse, ShieldAlert } from "lucide-react";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda, TitoloSezione, Caricamento } from "@/mobile/atoms";
import { useAuth } from "@/lib/auth";
import { filtriPerProfilo } from "@/lib/ambito";
import { ETICHETTE_RUOLO } from "@/lib/labels";
import { haPrivilegio } from "@/lib/livelli";
import { useQuery } from "@tanstack/react-query";
import { fetchFotografie, fetchSegnalazioni } from "@/lib/queries";
import { StatoBadge } from "@/components/StatoBadge";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";
import { PulsanteInstalla } from "@/components/PulsanteInstalla";

export function PwaHome() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const filtri = filtriPerProfilo(profilo);
  const puoSegnalare = haPrivilegio(profilo, "segnalare");
  const puoCoda = haPrivilegio(profilo, "coda");
  const puoFdr = haPrivilegio(profilo, "fdr");
  const seg = useQuery({ queryKey: ["segnalazioni", filtri], queryFn: () => fetchSegnalazioni(filtri) });
  const fdr = useQuery({ queryKey: ["fdr", filtri], queryFn: () => fetchFotografie(filtri), enabled: puoFdr });

  if (seg.isLoading) return <Caricamento />;

  const lista = puoCoda ? (seg.data ?? []) : [];
  const inviate = lista.filter((s) => s.stato === "inviata").length;
  const lavorazione = lista.filter((s) => s.stato === "in_lavorazione").length;
  const anonime = lista.filter((s) => s.anonima).length;
  const reparti = (profilo?.assegnazioni ?? []).map((a) => a.unita?.nome ?? cat.nomeUnita(a.unita_operativa_id));

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <Intestazione titolo="Home" sottotitolo={`${profilo?.nome} · ${ETICHETTE_RUOLO[profilo?.ruolo ?? "operatore"]}`} />

      <PulsanteInstalla />

      <p className="mb-3 text-[10.5px] text-muted-foreground">
        Reparto: {reparti.length ? reparti.join(", ") : "nessun reparto assegnato"}
      </p>

      <div className="griglia-kpi mb-4 grid grid-cols-2 gap-2">
        <MiniKpi icon={FileWarning} titolo="Da prendere" valore={inviate} />
        <MiniKpi icon={ClipboardPlus} titolo="In lavorazione" valore={lavorazione} />
        <MiniKpi icon={HeartPulse} titolo="Anonime" valore={anonime} />
        <MiniKpi icon={ShieldAlert} titolo="FDR" valore={fdr.data?.length ?? 0} />
      </div>

      {puoSegnalare ? (
        <Link
          to="/app/nuova"
          className="mb-4 flex min-h-11 w-full items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground shadow-glow"
        >
          Nuova segnalazione
        </Link>
      ) : null}

      <TitoloSezione>Moduli</TitoloSezione>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {puoCoda ? <Modulo to="/app/coda" titolo="Segnalazioni" nota={`${lista.length} schede`} /> : null}
        {puoFdr ? <Modulo to="/app/fdr" titolo="FDR" nota={`${fdr.data?.length ?? 0} rilevazioni`} /> : null}
      </div>

      {puoCoda ? (
        <>
          <TitoloSezione>Ultime segnalazioni</TitoloSezione>
          <ul className="mt-2 space-y-2">
            {lista.slice(0, 4).map((s) => (
              <li key={s.id}>
                <Link to={`/app/coda/${s.id}`}>
                  <Scheda>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[13px] font-bold">
                          {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                        </p>
                        <p className="truncate text-[10.5px] text-muted-foreground">
                          {s.presidio?.nome} · {formatData(s.data_ora_evento)}
                        </p>
                      </div>
                      <StatoBadge stato={s.stato} />
                    </div>
                  </Scheda>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function MiniKpi({ icon: Icona, titolo, valore }: { icon: typeof FileWarning; titolo: string; valore: number }) {
  return (
    <Scheda className="p-3">
      <div className="flex items-start justify-between">
        <p className="text-[10.5px] font-semibold text-muted-foreground">{titolo}</p>
        <Icona className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-1 font-display text-2xl font-bold">{valore}</p>
    </Scheda>
  );
}

function Modulo({ to, titolo, nota }: { to: string; titolo: string; nota: string }) {
  return (
    <Link to={to}>
      <Scheda>
        <p className="font-display text-[13px] font-bold">{titolo}</p>
        <p className="text-[10.5px] text-muted-foreground">{nota}</p>
      </Scheda>
    </Link>
  );
}
