import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchFotografia, fetchVociFotografia, fetchVociModello } from "@/lib/queries";
import { Caricamento, Vuoto } from "@/mobile/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pillFdr } from "@/components/StatoBadge";
import { formatData } from "@/lib/format";

export function BoFdrDettaglio() {
  const { id } = useParams();
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

  if (foto.isLoading) return <Caricamento />;
  if (!foto.data) return <Vuoto titolo="Non trovata" testo="Fotografia assente." />;
  const f = foto.data;
  const risposte = new Map((vociFoto.data ?? []).map((v) => [v.voce_modello_id, v]));

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
        const r = risposte.get(voce.id);
        return (
          <Card key={voce.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {voce.area ? `${voce.area} · ` : ""}
                {voce.testo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{r?.risposta || "Non compilata"}</p>
              {r?.nota ? <p className="mt-1 text-sm text-muted-foreground">{r.nota}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
