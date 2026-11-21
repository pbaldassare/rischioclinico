import { Link } from "react-router-dom";
import { ClipboardPlus, FileWarning, HeartPulse, ShieldAlert } from "lucide-react";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda, TitoloSezione, Caricamento } from "@/mobile/atoms";
import { useAuth } from "@/lib/auth";
import { ETICHETTE_RUOLO } from "@/lib/labels";
import { useQuery } from "@tanstack/react-query";
import { fetchFotografie, fetchSegnalazioni, fetchSinistri } from "@/lib/queries";
import { StatoBadge } from "@/components/StatoBadge";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";

export function PwaHome() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const filtri = { aziendaId: profilo?.azienda_id };
  const seg = useQuery({ queryKey: ["segnalazioni", filtri], queryFn: () => fetchSegnalazioni(filtri) });
  const sin = useQuery({ queryKey: ["sinistri", filtri], queryFn: () => fetchSinistri(filtri) });
  const fdr = useQuery({ queryKey: ["fdr", filtri], queryFn: () => fetchFotografie(filtri) });

  if (seg.isLoading) return <Caricamento />;

  const lista = seg.data ?? [];
  const inviate = lista.filter((s) => s.stato === "inviata").length;
  const lavorazione = lista.filter((s) => s.stato === "in_lavorazione").length;
  const anonime = lista.filter((s) => s.anonima).length;

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <Intestazione titolo="Home" sottotitolo={`${profilo?.nome} · ${ETICHETTE_RUOLO[profilo?.ruolo ?? "operatore"]}`} />

      <div className="griglia-kpi mb-4 grid grid-cols-2 gap-2">
        <MiniKpi icon={FileWarning} titolo="Da prendere" valore={inviate} />
        <MiniKpi icon={ClipboardPlus} titolo="In lavorazione" valore={lavorazione} />
        <MiniKpi icon={HeartPulse} titolo="Anonime" valore={anonime} />
        <MiniKpi icon={ShieldAlert} titolo="Sinistri" valore={sin.data?.length ?? 0} />
      </div>

      <Link
        to="/app/nuova"
        className="mb-4 flex min-h-11 w-full items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground shadow-glow"
      >
        Nuova segnalazione
      </Link>

      <TitoloSezione>Moduli</TitoloSezione>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Modulo to="/app/coda" titolo="Segnalazioni" nota={`${lista.length} schede`} />
        <Modulo to="/app/coda" titolo="FDR" nota={`${fdr.data?.length ?? 0} rilevazioni`} />
        <Modulo to="/bo/sinistri" titolo="Sinistri" nota="Apri backoffice" />
        <Modulo to="/bo" titolo="Pratiche legali" nota="In arrivo" />
      </div>

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
