import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BoLegale() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Pratiche legali</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Modulo previsto dal disegno della piattaforma (cause, soccombenza, collegamento al sinistro). Nel primo
          rilascio resta in consultazione: i dati seed sono visibili dai sinistri in causa.
        </p>
        <p>Arriva completo nel secondo rilascio.</p>
      </CardContent>
    </Card>
  );
}
