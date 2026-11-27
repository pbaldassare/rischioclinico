import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCatalog } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { ePresidio } from "@/lib/livelli";
import { creaReparto } from "@/lib/queries";
import { AttivitaOspedale } from "@/components/AttivitaOspedale";

export function BoReparti() {
  const { profilo } = useAuth();
  const cat = useCatalog();
  const qc = useQueryClient();
  const [presidioId, setPresidioId] = useState(cat.presidi[0]?.id ?? "");
  const [nome, setNome] = useState("");

  const crea = useMutation({
    mutationFn: () => creaReparto({ presidio_id: presidioId, nome }),
    onSuccess: () => {
      toast.success("Reparto creato");
      setNome("");
      void qc.invalidateQueries({ queryKey: ["unita"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ePresidio(profilo)) return <Navigate to="/bo" replace />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        L’ASL crea i reparti dei propri ospedali e poi assegna gli operatori con i privilegi.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ospedali</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {cat.presidi.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {p.nome}
                  {p.posti_letto ? ` · ${p.posti_letto} posti letto` : ""}
                </span>
                <AttivitaOspedale presidio={p} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Reparti</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ospedale</TableHead>
                <TableHead>Reparto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cat.unita.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{cat.nomePresidio(u.presidio_id)}</TableCell>
                  <TableCell>{u.nome}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nuovo reparto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Ospedale</Label>
            <Select value={presidioId || undefined} onValueChange={setPresidioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cat.presidi.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nome reparto</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!presidioId || !nome.trim() || crea.isPending}
              onClick={() => crea.mutate()}
            >
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
