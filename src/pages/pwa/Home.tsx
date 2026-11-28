import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, PlusCircle } from "lucide-react";
import { Scheda, TitoloSezione, Caricamento } from "@/mobile/atoms";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { fetchMieSegnalazioni } from "@/lib/queries";
import { formatData } from "@/lib/format";
import { PulsanteInstalla } from "@/components/PulsanteInstalla";

function saluto() {
  const h = new Date().getHours();
  return h < 13 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
}

export function PwaHome() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const mie = useQuery({
    queryKey: ["segnalazioni", "mie", profilo?.id],
    queryFn: () => fetchMieSegnalazioni(profilo!.id),
    enabled: !!profilo,
  });
  const reparti = (profilo?.assegnazioni ?? []).map((a) => a.unita?.nome ?? cat.nomeUnita(a.unita_operativa_id));

  if (mie.isLoading) return <Caricamento />;
  const lista = mie.data ?? [];

  return (
    <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{saluto()}</p>
      <h1 className="font-display text-2xl font-bold">{profilo?.nome}</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        {reparti.length ? reparti.join(", ") : "Nessun reparto assegnato"}
        {profilo?.presidio_id ? ` · ${cat.nomePresidio(profilo.presidio_id)}` : ""}
      </p>

      <Link
        to="/app/nuova"
        className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary font-display text-base font-bold text-primary-foreground shadow-glow"
      >
        <PlusCircle className="h-5 w-5" aria-hidden />
        Nuova segnalazione
      </Link>

      <PulsanteInstalla className="mt-4" />

      <Scheda className="mt-4 flex items-center justify-between p-4">
        <span className="text-sm text-muted-foreground">Segnalazioni fatte</span>
        <span className="font-display text-2xl font-bold">{lista.length}</span>
      </Scheda>

      <TitoloSezione>Le tue ultime segnalazioni</TitoloSezione>
      {lista.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Nessuna segnalazione ancora. Parti dal pulsante qui sopra.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {lista.slice(0, 5).map((s) => (
            <li key={s.id}>
              <Link to={`/app/segnalazioni/${s.id}`}>
                <Scheda className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[13px] font-bold">
                      {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                    </p>
                    <p className="truncate text-[10.5px] text-muted-foreground">
                      {s.unita?.nome ?? cat.nomeUnita(s.unita_operativa_id)} · {formatData(s.data_ora_evento, true)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
                </Scheda>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
