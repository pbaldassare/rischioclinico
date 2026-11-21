import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export function formatData(value?: string | null, withTime = false) {
  if (!value) return "—";
  try {
    const d = parseISO(value);
    return format(d, withTime ? "d MMM yyyy, HH:mm" : "d MMM yyyy", { locale: it });
  } catch {
    return value;
  }
}

export function formatEuro(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function sommaMovimenti(
  movimenti: { tipo: string; importo: number }[] | null | undefined,
  tipi: string[],
) {
  return (movimenti ?? [])
    .filter((m) => tipi.includes(m.tipo))
    .reduce((acc, m) => acc + Number(m.importo || 0), 0);
}

export function annoDi(value?: string | null) {
  if (!value) return null;
  const y = parseISO(value).getFullYear();
  return Number.isNaN(y) ? null : y;
}
