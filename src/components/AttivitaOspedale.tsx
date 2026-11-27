import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAttivita, salvaAttivita } from "@/lib/queries";
import { numeroONull } from "@/components/Campi";
import type { Presidio } from "@/lib/types";

// Gli ultimi 4 anni, come il filtro anno del backoffice.
const ANNI = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

type Riga = { ricoveri: string; giornate: string };

/** Ricoveri e giornate di degenza per anno: il denominatore degli indicatori di frequenza. */
export function AttivitaOspedale({ presidio }: { presidio: Presidio }) {
  const qc = useQueryClient();
  const [aperto, setAperto] = useState(false);
  const [righe, setRighe] = useState<Record<number, Riga>>({});
  const q = useQuery({
    queryKey: ["attivita", presidio.id],
    queryFn: () => fetchAttivita(presidio.id),
    enabled: aperto,
  });

  function riempi() {
    const next: Record<number, Riga> = {};
    for (const anno of ANNI) {
      const r = q.data?.find((a) => a.anno === anno);
      next[anno] = { ricoveri: r?.ricoveri?.toString() ?? "", giornate: r?.giornate_degenza?.toString() ?? "" };
    }
    setRighe(next);
  }
  // Riempie il modulo appena arrivano i dati della prima apertura.
  if (aperto && q.data && Object.keys(righe).length === 0) riempi();

  const salva = useMutation({
    mutationFn: () =>
      salvaAttivita(
        ANNI.filter((a) => righe[a]?.ricoveri || righe[a]?.giornate).map((anno) => ({
          presidio_id: presidio.id,
          anno,
          ricoveri: numeroONull(righe[anno].ricoveri),
          giornate_degenza: numeroONull(righe[anno].giornate),
        })),
      ),
    onSuccess: () => {
      toast.success("Ricoveri salvati");
      setAperto(false);
      void qc.invalidateQueries({ queryKey: ["attivita"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (anno: number, k: keyof Riga, v: string) =>
    setRighe((prev) => ({ ...prev, [anno]: { ...prev[anno], [k]: v } }));

  return (
    <Dialog
      open={aperto}
      onOpenChange={(v) => {
        setRighe({});
        setAperto(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Ricoveri
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Ricoveri — {presidio.nome}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Servono per gli indicatori di frequenza, per esempio cadute ogni 10.000 ricoveri.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anno</TableHead>
              <TableHead>Ricoveri</TableHead>
              <TableHead>Giornate di degenza</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ANNI.map((anno) => (
              <TableRow key={anno}>
                <TableCell className="font-semibold">{anno}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    aria-label={`Ricoveri ${anno}`}
                    value={righe[anno]?.ricoveri ?? ""}
                    onChange={(e) => set(anno, "ricoveri", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    aria-label={`Giornate di degenza ${anno}`}
                    value={righe[anno]?.giornate ?? ""}
                    onChange={(e) => set(anno, "giornate", e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button disabled={q.isLoading || salva.isPending} onClick={() => salva.mutate()}>
          Salva
        </Button>
      </DialogContent>
    </Dialog>
  );
}
