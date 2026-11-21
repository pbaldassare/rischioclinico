import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFotografia, fetchVociFotografia, fetchVociModello } from "@/lib/queries";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pillFdr } from "@/components/StatoBadge";
import { formatData } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { haPrivilegio } from "@/lib/livelli";

const RISPOSTE = ["Conforme", "Parziale", "Non conforme", "Non applicabile"];

export function BoFdrDettaglio() {
  const { id } = useParams();
  const { profilo } = useAuth();
  const qc = useQueryClient();
  const puoCompilare = haPrivilegio(profilo, "fdr");
  const foto = useQuery({ queryKey: ["fotografia", id], queryFn: () => fetchFotografia(id!), enabled: !!id });
  const vociFoto = useQuery({
    queryKey: ["fotografia-voci", id],
    queryFn: () => fetchVociFotografia(id!),
    enabled: !!id,
  });
  const vociModello = useQuery({
    queryKey: ["voci-modello", foto.data?.modello_id],
    queryFn: () => fetchVociModello(foto.data!.modello_id!),
    enabled: !!foto.data?.modello_id,
  });

  const [draft, setDraft] = useState<Record<string, { risposta: string; nota: string }>>({});
  useEffect(() => {
    const next: Record<string, { risposta: string; nota: string }> = {};
    for (const voce of vociModello.data ?? []) {
      const r = (vociFoto.data ?? []).find((v) => v.voce_modello_id === voce.id);
      next[voce.id] = { risposta: r?.risposta || "", nota: r?.nota || "" };
    }
    setDraft(next);
  }, [vociModello.data, vociFoto.data]);

  const salva = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Fotografia assente");
      const esistenti = vociFoto.data ?? [];
      for (const voce of vociModello.data ?? []) {
        const d = draft[voce.id] ?? { risposta: "", nota: "" };
        const gia = esistenti.find((v) => v.voce_modello_id === voce.id);
        if (gia) {
          const { error } = await supabase
            .from("fotografie_voci")
            .update({ risposta: d.risposta || null, nota: d.nota || null })
            .eq("id", gia.id);
          if (error) throw error;
        } else if (d.risposta || d.nota) {
          const { error } = await supabase.from("fotografie_voci").insert({
            fotografia_id: id,
            voce_modello_id: voce.id,
            risposta: d.risposta || null,
            nota: d.nota || null,
          });
          if (error) throw error;
        }
      }
      const compilate = (vociModello.data ?? []).every((v) => draft[v.id]?.risposta);
      if (compilate && foto.data?.stato === "bozza") {
        const { error } = await supabase.from("fotografie_rischio").update({ stato: "completata" }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Checklist salvata");
      qc.invalidateQueries({ queryKey: ["fotografia-voci", id] });
      qc.invalidateQueries({ queryKey: ["fotografia", id] });
      qc.invalidateQueries({ queryKey: ["fdr"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (foto.isLoading) return <Caricamento />;
  if (!foto.data) return <Vuoto titolo="Non trovata" testo="Fotografia assente." />;
  const f = foto.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {f.modello?.nome}
            {pillFdr(f.stato)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {f.presidio?.nome} · {f.unita?.nome} · {formatData(f.periodo_dal)} – {formatData(f.periodo_al)}
        </CardContent>
      </Card>
      {(vociModello.data ?? []).map((voce) => {
        const d = draft[voce.id] ?? { risposta: "", nota: "" };
        return (
          <Card key={voce.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {voce.area ? `${voce.area} · ` : ""}
                {voce.testo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {puoCompilare ? (
                <>
                  <div className="space-y-2">
                    <Label>Risposta</Label>
                    <Select
                      value={d.risposta || undefined}
                      onValueChange={(v) => setDraft((prev) => ({ ...prev, [voce.id]: { ...d, risposta: v } }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Scegli" />
                      </SelectTrigger>
                      <SelectContent>
                        {RISPOSTE.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nota</Label>
                    <Textarea
                      value={d.nota}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [voce.id]: { ...d, nota: e.target.value } }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p>{d.risposta || "Non compilata"}</p>
                  {d.nota ? <p className="mt-1 text-sm text-muted-foreground">{d.nota}</p> : null}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
      {puoCompilare ? (
        <Button className="w-full" onClick={() => salva.mutate()} disabled={salva.isPending}>
          Salva checklist
        </Button>
      ) : null}
    </div>
  );
}
