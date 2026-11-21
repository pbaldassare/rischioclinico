import { Link, useNavigate } from "react-router-dom";
import { Intestazione } from "@/mobile/Intestazione";
import { Scheda } from "@/mobile/atoms";
import { useAuth } from "@/lib/auth";
import { ETICHETTE_RUOLO } from "@/lib/labels";
import { useCatalog } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export function PwaProfilo() {
  const { profilo, esci } = useAuth();
  const cat = useCatalog();
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col px-4 pb-6">
      <Intestazione titolo="Profilo" sottotitolo="Sessione demo" />
      <Scheda className="p-4">
        <p className="font-display text-lg font-bold">{profilo?.nome}</p>
        <p className="text-sm text-muted-foreground">{profilo?.email}</p>
        <p className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary inline-block">
          {ETICHETTE_RUOLO[profilo?.ruolo ?? "operatore"]}
        </p>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Azienda</dt>
            <dd>{cat.nomeAzienda(profilo?.azienda_id)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Presidio</dt>
            <dd>{cat.nomePresidio(profilo?.presidio_id)}</dd>
          </div>
        </dl>
      </Scheda>
      <Link
        to="/bo"
        className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-border bg-card font-semibold"
      >
        Apri backoffice
      </Link>
      <Button
        variant="outline"
        className="mt-2 w-full"
        onClick={() => {
          esci();
          navigate("/");
        }}
      >
        Esci
      </Button>
    </div>
  );
}
