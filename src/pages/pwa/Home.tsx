import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, PlusCircle, Sparkles } from "lucide-react";
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
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <section className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">{saluto()}</p>
        <h1 className="mt-1 font-display text-[26px] font-bold leading-tight">{[profilo?.nome, profilo?.cognome].filter(Boolean).join(" ")}</h1>
        <p className="mt-2 text-sm opacity-90">
          {reparti.length ? reparti.join(", ") : "Nessun reparto assegnato"}
          {profilo?.presidio_id ? ` · ${cat.nomePresidio(profilo.presidio_id)}` : ""}
        </p>
        <Link
          to="/app/nuova"
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-card font-display text-base font-bold text-primary shadow-card"
        >
          <PlusCircle className="h-5 w-5" aria-hidden />
          Nuova segnalazione
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Scheda className="p-4">
          <p className="text-xs text-muted-foreground">Segnalazioni fatte</p>
          <p className="mt-1 font-display text-3xl font-bold">{lista.length}</p>
        </Scheda>
        <Scheda className="p-4">
          <p className="text-xs text-muted-foreground">Ultima</p>
          <p className="mt-1 font-display text-lg font-bold leading-snug">{lista[0] ? formatData(lista[0].created_at) : "—"}</p>
        </Scheda>
      </div>

      <Link to="/app/nuova" className="block">
        <Scheda className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-secondary text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold">Racconta a voce o con una foto</p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">L’assistente compila la scheda, tu controlli e invii.</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
        </Scheda>
      </Link>

      <PulsanteInstalla />

      <section>
      <TitoloSezione>Le tue ultime segnalazioni</TitoloSezione>
      {lista.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nessuna segnalazione ancora. Parti dal pulsante qui sopra.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {lista.slice(0, 5).map((s) => (
            <li key={s.id}>
              <Link to={`/app/segnalazioni/${s.id}`}>
                <Scheda className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-bold">
                      {cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
      </section>
    </div>
  );
}
