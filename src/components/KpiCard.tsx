import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  titolo,
  valore,
  nota,
  icon: Icona,
  tinta = "text-primary",
}: {
  titolo: string;
  valore: string | number;
  nota?: string;
  icon: LucideIcon;
  tinta?: string;
}) {
  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{titolo}</p>
          <Icona className={cn("h-8 w-8", tinta)} />
        </div>
        <p className="font-display text-3xl font-bold leading-none">{valore}</p>
        {nota ? <p className="mt-2 text-xs text-muted-foreground">{nota}</p> : null}
      </CardContent>
    </Card>
  );
}
