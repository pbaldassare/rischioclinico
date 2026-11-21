import { useNavigate } from "react-router-dom";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda } from "@/mobile/atoms";
import { useAuth } from "@/lib/auth";
import { ETICHETTE_RUOLO } from "@/lib/labels";
import { useCatalog } from "@/lib/catalog";
import { PRIVILEGI_OPERATORE } from "@/lib/livelli";
import { Button } from "@/components/ui/button";

export function PwaProfilo() {
  const { profilo, esci } = useAuth();
  const cat = useCatalog();
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione titolo="Profilo" sottotitolo="Sessione autenticata" />
      <Scheda className="p-4">
        <p className="font-display text-lg font-bold">{profilo?.nome}</p>
        <p className="text-sm text-muted-foreground">{profilo?.email}</p>
        <p className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {ETICHETTE_RUOLO[profilo?.ruolo ?? "operatore"]}
        </p>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">ASL</dt>
            <dd>{cat.nomeAzienda(profilo?.azienda_id)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Ospedale</dt>
            <dd>{cat.nomePresidio(profilo?.presidio_id)}</dd>
          </div>
        </dl>
      </Scheda>
      <Scheda className="mt-3 p-4">
        <p className="font-display text-sm font-bold">Reparti e privilegi</p>
        <ul className="mt-2 space-y-2 text-sm">
          {(profilo?.assegnazioni ?? []).map((a) => (
            <li key={a.id}>
              <p className="font-semibold">{a.unita?.nome ?? cat.nomeUnita(a.unita_operativa_id)}</p>
              <p className="text-[10.5px] text-muted-foreground">
                {a.privilegi
                  .map((p) => PRIVILEGI_OPERATORE.find((x) => x.codice === p)?.etichetta ?? p)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </Scheda>
      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() => {
          void esci().then(() => navigate("/"));
        }}
      >
        Esci
      </Button>
    </div>
  );
}
