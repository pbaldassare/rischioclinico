import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Campo, SceltaPresidioReparto, SelectOpzioni } from "@/components/Campi";
import { useCatalog } from "@/lib/catalog";
import { creaFotografia, fetchModelliChecklist } from "@/lib/queries";

export function NuovaFotografia() {
  const cat = useCatalog();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const modelli = useQuery({ queryKey: ["modelli-checklist"], queryFn: fetchModelliChecklist });
  const [aperto, setAperto] = useState(false);
  const [presidioId, setPresidioId] = useState("");
  const [unitaId, setUnitaId] = useState("");
  const [modelloId, setModelloId] = useState("");
  const [dal, setDal] = useState("");
  const [al, setAl] = useState("");

  const crea = useMutation({
    mutationFn: () => {
      const azienda_id = cat.presidi.find((p) => p.id === presidioId)?.azienda_id;
      if (!azienda_id) throw new Error("Scegli l’ospedale");
      return creaFotografia({
        azienda_id,
        presidio_id: presidioId,
        unita_operativa_id: unitaId || null,
        modello_id: modelloId,
        periodo_dal: dal || null,
        periodo_al: al || null,
      });
    },
    onSuccess: (id) => {
      toast.success("Fotografia creata: compila la checklist");
      setAperto(false);
      void qc.invalidateQueries({ queryKey: ["fdr"] });
      navigate(`/bo/fdr/${id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button>Nuova fotografia</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nuova fotografia del rischio</DialogTitle>
        </DialogHeader>
        <SceltaPresidioReparto
          presidioId={presidioId}
          unitaId={unitaId}
          onChange={(p, u) => {
            setPresidioId(p);
            setUnitaId(u);
          }}
        />
        <Campo label="Checklist">
          <SelectOpzioni
            value={modelloId}
            onChange={setModelloId}
            opzioni={(modelli.data ?? []).map((m) => [m.id, `${m.nome} (v${m.versione})`])}
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Periodo dal">
            <Input type="date" value={dal} onChange={(e) => setDal(e.target.value)} />
          </Campo>
          <Campo label="al">
            <Input type="date" value={al} onChange={(e) => setAl(e.target.value)} />
          </Campo>
        </div>
        <Button disabled={!presidioId || !modelloId || crea.isPending} onClick={() => crea.mutate()}>
          Crea e compila
        </Button>
      </DialogContent>
    </Dialog>
  );
}
