import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalog } from "@/lib/catalog";

// Radix Select non accetta "" come valore: questo segnaposto vale "nessuna scelta".
const NESSUNO = "__nessuno";

export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Select su coppie [valore, etichetta]; con `vuoto` si può lasciare senza scelta (valore ""). */
export function SelectOpzioni({
  value,
  onChange,
  opzioni,
  vuoto,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  opzioni: [string, string][];
  vuoto?: string;
  placeholder?: string;
}) {
  return (
    <Select
      value={value || (vuoto ? NESSUNO : undefined)}
      onValueChange={(v) => onChange(v === NESSUNO ? "" : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "Scegli"} />
      </SelectTrigger>
      <SelectContent>
        {vuoto ? <SelectItem value={NESSUNO}>{vuoto}</SelectItem> : null}
        {opzioni.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Select su un elenco della tabella classificazioni (tipo_elenco). */
export function SelectElenco(props: { elenco: string; value: string; onChange: (v: string) => void; vuoto?: string }) {
  const cat = useCatalog();
  return (
    <SelectOpzioni
      value={props.value}
      onChange={props.onChange}
      vuoto={props.vuoto}
      opzioni={cat.elenco(props.elenco).map((c) => [c.codice, c.etichetta])}
    />
  );
}

/** Ospedale + reparto: cambiando ospedale il reparto si azzera. */
export function SceltaPresidioReparto({
  presidioId,
  unitaId,
  onChange,
}: {
  presidioId: string;
  unitaId: string;
  onChange: (presidioId: string, unitaId: string) => void;
}) {
  const cat = useCatalog();
  return (
    <>
      <Campo label="Ospedale *">
        <SelectOpzioni
          value={presidioId}
          onChange={(v) => onChange(v, "")}
          opzioni={cat.presidi.map((p) => [p.id, p.nome])}
        />
      </Campo>
      <Campo label="Reparto">
        <SelectOpzioni
          value={unitaId}
          onChange={(v) => onChange(presidioId, v)}
          vuoto="— Nessun reparto —"
          opzioni={cat.unita.filter((u) => u.presidio_id === presidioId).map((u) => [u.id, u.nome])}
        />
      </Campo>
    </>
  );
}

export const SESSO: [string, string][] = [
  ["F", "Femmina"],
  ["M", "Maschio"],
];

export const vuotoANull = (v: string) => v.trim() || null;
export const numeroONull = (v: string) => (v.trim() === "" ? null : Number(v));
