import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCatalog } from "@/lib/catalog";
import type { FiltriAmbito as Filtri } from "@/lib/types";

const ANNI = ["2026", "2025", "2024", "2023"];

export function FiltriAmbito({
  value,
  onChange,
  mostraAzienda = true,
}: {
  value: Filtri;
  onChange: (next: Filtri) => void;
  mostraAzienda?: boolean;
}) {
  const { aziende, presidi, unita } = useCatalog();
  const presidiFiltrati = presidi.filter(
    (p) => !value.aziendaId || p.azienda_id === value.aziendaId,
  );
  const unitaFiltrate = unita.filter(
    (u) => !value.presidioId || u.presidio_id === value.presidioId,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {mostraAzienda ? (
        <Campo label="ASL">
          <Select
            value={value.aziendaId ?? "tutte"}
            onValueChange={(v) =>
              onChange({
                ...value,
                aziendaId: v === "tutte" ? null : v,
                presidioId: null,
                unitaId: null,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Azienda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutte">Tutte le ASL</SelectItem>
              {aziende.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      ) : null}

      <Campo label="Ospedale">
        <Select
          value={value.presidioId ?? "tutti"}
          onValueChange={(v) =>
            onChange({
              ...value,
              presidioId: v === "tutti" ? null : v,
              unitaId: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Presidio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli ospedali</SelectItem>
            {presidiFiltrati.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo label="Reparto">
        <Select
          value={value.unitaId ?? "tutti"}
          onValueChange={(v) =>
            onChange({ ...value, unitaId: v === "tutti" ? null : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Reparto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti i reparti</SelectItem>
            {unitaFiltrate.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome}
                {value.presidioId
                  ? ""
                  : ` · ${presidi.find((p) => p.id === u.presidio_id)?.nome ?? ""}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo label="Anno evento">
        <Select
          value={value.anno ?? "tutti"}
          onValueChange={(v) =>
            onChange({ ...value, anno: v === "tutti" ? null : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Anno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti gli anni</SelectItem>
            {ANNI.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
