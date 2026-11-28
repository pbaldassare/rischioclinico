import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAllegati, fetchSegnalazione } from "@/lib/queries";
import { urlFirmato } from "@/lib/allegati";
import { Intestazione } from "@/mobile/Intestazione";
import { Caricamento, Scheda, Vuoto } from "@/mobile/atoms";
import { useCatalog } from "@/lib/catalog";
import { formatData } from "@/lib/format";

/** Vista di sola lettura per l'operatore: quello che ha segnalato, niente stati o lavorazione. */
export function PwaDettaglio() {
  const { id } = useParams();
  const cat = useCatalog();
  const q = useQuery({ queryKey: ["segnalazione", id], queryFn: () => fetchSegnalazione(id!), enabled: !!id });
  const allegati = useQuery({ queryKey: ["allegati", id], queryFn: () => fetchAllegati(id!), enabled: !!id });

  if (q.isLoading) return <Caricamento />;
  const s = q.data;
  if (!s) return <Vuoto titolo="Non trovata" testo="La segnalazione non esiste o non è visibile." />;

  const righe: [string, string][] = [
    ["Data e ora", formatData(s.data_ora_evento, true)],
    ["Reparto", `${s.unita?.nome ?? cat.nomeUnita(s.unita_operativa_id)} · ${s.presidio?.nome ?? cat.nomePresidio(s.presidio_id)}`],
    ["Luogo", cat.etichetta("luogo", s.luogo_codice)],
    ["Gravità", cat.etichetta("gravita", s.gravita_codice)],
    ["Esito", cat.etichetta("magnitudo", s.magnitudo_codice)],
    ["Fase di cura", cat.etichetta("fase_cura", s.fase_cura_codice)],
  ];

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione
        titolo={cat.etichetta("tipo_evento_ir", s.tipo_evento_codice)}
        sottotitolo={s.sentinella ? "Evento sentinella" : "Segnalazione inviata"}
        indietro
      />
      <Scheda className="p-4">
        <dl className="space-y-1.5 text-sm">
          {righe.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Scheda>
      <Scheda className="mt-3 p-4">
        <p className="font-display text-sm font-bold">Dinamica</p>
        <p className="mt-1 text-sm leading-relaxed">{s.dinamica}</p>
        {s.impatto ? (
          <>
            <p className="mt-3 font-display text-sm font-bold">Impatto</p>
            <p className="mt-1 text-sm leading-relaxed">{s.impatto}</p>
          </>
        ) : null}
      </Scheda>
      {allegati.data?.length ? (
        <Scheda className="mt-3 p-4">
          <p className="font-display text-sm font-bold">Allegati</p>
          <ul className="mt-2 space-y-1 text-sm">
            {allegati.data.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={async () => {
                    const url = a.url ? await urlFirmato(a.url) : null;
                    if (url) window.open(url, "_blank", "noopener");
                  }}
                >
                  {a.nome_file}
                </button>
              </li>
            ))}
          </ul>
        </Scheda>
      ) : null}
    </div>
  );
}
