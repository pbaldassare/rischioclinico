import { supabase } from "./supabase";
import type {
  Azienda,
  Classificazione,
  Allegato,
  EventoSentinella,
  FasciaImporto,
  FiltriAmbito,
  FotografiaRischio,
  PraticaLegale,
  Presidio,
  Profile,
  Segnalazione,
  Sinistro,
  TipoSentinella,
  UnitaOperativa,
  VoceFotografia,
  VoceModello,
} from "./types";

const SEGNALAZIONE_SELECT = `
  *,
  presidio:presidi(id,nome,azienda_id),
  unita:unita_operative(id,nome,presidio_id),
  rca:analisi_rca(*),
  azioni:azioni_correttive(*)
`;

const SINISTRO_SELECT = `
  *,
  presidio:presidi(id,nome,azienda_id),
  unita:unita_operative(id,nome,presidio_id),
  movimenti:movimenti_economici(*)
`;

export async function fetchProfile(id: string, email?: string | null) {
  const byId = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (byId.error) throw byId.error;
  if (byId.data) return byId.data as Profile;
  if (!email) return null;
  const byEmail = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
  if (byEmail.error) throw byEmail.error;
  return (byEmail.data as Profile) ?? null;
}

export async function fetchAziende() {
  const { data, error } = await supabase.from("aziende").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Azienda[];
}

export async function fetchPresidi() {
  const { data, error } = await supabase.from("presidi").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Presidio[];
}

export async function fetchUnita() {
  const { data, error } = await supabase.from("unita_operative").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as UnitaOperativa[];
}

export async function fetchClassificazioni() {
  const { data, error } = await supabase
    .from("classificazioni")
    .select("*")
    .eq("attivo", true)
    .order("ordine");
  if (error) throw error;
  return (data ?? []) as Classificazione[];
}

export async function fetchTipiSentinella() {
  const { data, error } = await supabase
    .from("tipi_sentinella")
    .select("*")
    .eq("attivo", true)
    .order("codice");
  if (error) throw error;
  return (data ?? []) as TipoSentinella[];
}

export async function fetchFasce() {
  const { data, error } = await supabase.from("fasce_importo").select("*").order("ordine");
  if (error) throw error;
  return (data ?? []) as FasciaImporto[];
}

function applicaFiltri<T extends { eq: (c: string, v: unknown) => T; gte: (c: string, v: unknown) => T; lt: (c: string, v: unknown) => T }>(
  q: T,
  filtri?: FiltriAmbito,
  campoData = "data_ora_evento",
) {
  let query = q;
  if (filtri?.aziendaId) query = query.eq("azienda_id", filtri.aziendaId);
  if (filtri?.presidioId) query = query.eq("presidio_id", filtri.presidioId);
  if (filtri?.unitaId) query = query.eq("unita_operativa_id", filtri.unitaId);
  if (filtri?.anno) {
    const y = Number(filtri.anno);
    query = query.gte(campoData, `${y}-01-01`).lt(campoData, `${y + 1}-01-01`);
  }
  return query;
}

export async function fetchSegnalazioni(filtri?: FiltriAmbito) {
  let q = supabase.from("segnalazioni").select(SEGNALAZIONE_SELECT).order("data_ora_evento", {
    ascending: false,
  });
  q = applicaFiltri(q, filtri, "data_ora_evento");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Segnalazione[];
}

export async function fetchSegnalazione(id: string) {
  const { data, error } = await supabase
    .from("segnalazioni")
    .select(SEGNALAZIONE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Segnalazione | null;
}

export async function fetchSinistri(filtri?: FiltriAmbito) {
  let q = supabase.from("sinistri").select(SINISTRO_SELECT).order("data_evento", { ascending: false });
  q = applicaFiltri(q, filtri, "data_evento");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Sinistro[];
}

export async function fetchSinistro(id: string) {
  const { data, error } = await supabase
    .from("sinistri")
    .select(SINISTRO_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Sinistro | null;
}

export async function fetchSinistroDaSegnalazione(segnalazioneId: string) {
  const { data, error } = await supabase
    .from("sinistri")
    .select("id, codice_interno")
    .eq("segnalazione_id", segnalazioneId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; codice_interno: string | null } | null;
}

export async function fetchFotografie(filtri?: FiltriAmbito) {
  let q = supabase
    .from("fotografie_rischio")
    .select(
      `*,
      presidio:presidi(id,nome,azienda_id),
      unita:unita_operative(id,nome,presidio_id),
      modello:modelli_checklist(id,nome,versione)`,
    )
    .order("created_at", { ascending: false });
  if (filtri?.aziendaId) q = q.eq("azienda_id", filtri.aziendaId);
  if (filtri?.presidioId) q = q.eq("presidio_id", filtri.presidioId);
  if (filtri?.unitaId) q = q.eq("unita_operativa_id", filtri.unitaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FotografiaRischio[];
}

export async function fetchFotografia(id: string) {
  const { data, error } = await supabase
    .from("fotografie_rischio")
    .select(
      `*,
      presidio:presidi(id,nome,azienda_id),
      unita:unita_operative(id,nome,presidio_id),
      modello:modelli_checklist(id,nome,versione)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as FotografiaRischio | null;
}

export async function fetchVociFotografia(id: string) {
  const { data, error } = await supabase.from("fotografie_voci").select("*").eq("fotografia_id", id);
  if (error) throw error;
  return (data ?? []) as VoceFotografia[];
}

export async function fetchVociModello(modelloId: string) {
  const { data, error } = await supabase
    .from("voci_modello_checklist")
    .select("*")
    .eq("modello_id", modelloId)
    .order("ordine");
  if (error) throw error;
  return (data ?? []) as VoceModello[];
}

export async function fetchEventiSentinella(filtri?: FiltriAmbito) {
  let q = supabase
    .from("eventi_sentinella")
    .select(
      `*,
      presidio:presidi(id,nome,azienda_id),
      unita:unita_operative(id,nome,presidio_id)`,
    )
    .order("data_ora_evento", { ascending: false });
  q = applicaFiltri(q, filtri, "data_ora_evento");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EventoSentinella[];
}

export function rcaDi(s: Segnalazione) {
  const rca = s.rca;
  if (!rca) return null;
  return Array.isArray(rca) ? rca[0] ?? null : rca;
}

export async function fetchAllegati(segnalazioneId: string) {
  const { data, error } = await supabase
    .from("allegati")
    .select("*")
    .eq("segnalazione_id", segnalazioneId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Allegato[];
}

export async function fetchPratiche() {
  const { data, error } = await supabase
    .from("pratiche_legali")
    .select("*, sinistro:sinistri(id,codice_interno,presidio_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PraticaLegale[];
}

export async function fetchPratica(id: string) {
  const { data, error } = await supabase
    .from("pratiche_legali")
    .select("*, sinistro:sinistri(id,codice_interno,presidio_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PraticaLegale | null;
}

export async function fetchPraticaDaSinistro(sinistroId: string) {
  const { data, error } = await supabase
    .from("pratiche_legali")
    .select("id, numero_pratica, stato")
    .eq("sinistro_id", sinistroId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; numero_pratica: string | null; stato: string } | null;
}
