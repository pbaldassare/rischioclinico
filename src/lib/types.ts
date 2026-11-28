export type Ruolo = "admin" | "presidio" | "operatore";

export type Privilegio = "segnalare" | "coda" | "fdr" | "lavorare";

export interface AssegnazioneReparto {
  id: string;
  profile_id: string;
  unita_operativa_id: string;
  privilegi: Privilegio[];
  unita?: UnitaOperativa | null;
}

export interface Profile {
  id: string;
  azienda_id: string | null;
  presidio_id: string | null;
  email: string | null;
  nome: string | null;
  cognome: string | null;
  telefono: string | null;
  foto_url: string | null;
  ruolo: Ruolo;
  attivo: boolean;
  assegnazioni?: AssegnazioneReparto[] | null;
}

export interface Azienda {
  id: string;
  nome: string;
  codice_sis: string | null;
  regione_codice: string | null;
  tipo: string;
}

export interface Presidio {
  id: string;
  azienda_id: string;
  nome: string;
  codice_struttura: string | null;
  posti_letto: number | null;
}

export interface UnitaOperativa {
  id: string;
  presidio_id: string;
  nome: string;
  codice_disciplina: string | null;
}

export interface Classificazione {
  id: string;
  tipo_elenco: string;
  codice: string;
  etichetta: string;
  ordine: number;
  attivo: boolean;
}

export interface TipoSentinella {
  codice: number;
  etichetta: string;
  attivo: boolean;
}

export interface FasciaImporto {
  id: string;
  codice: string;
  etichetta: string;
  da_euro: number;
  a_euro: number | null;
  ordine: number;
}

export interface AnalisiRca {
  id: string;
  segnalazione_id: string;
  metodo_codice: string | null;
  p: number | null;
  m: number | null;
  r: number | null;
  indice_rischio: number | null;
  fattori: string | null;
  cause: string[];
  note_audit: string | null;
}

export interface AzioneCorrettiva {
  id: string;
  segnalazione_id: string;
  descrizione: string;
  responsabile_id: string | null;
  scadenza: string | null;
  stato: string;
  verificata_il: string | null;
  esito_verifica: string | null;
}

export interface Segnalazione {
  id: string;
  azienda_id: string;
  presidio_id: string | null;
  unita_operativa_id: string | null;
  luogo_codice: string | null;
  data_ora_evento: string | null;
  tipo_evento_codice: string | null;
  gravita_codice: string | null;
  magnitudo_codice: string | null;
  fase_cura_codice: string | null;
  sentinella: boolean;
  tipo_sentinella_codice: number | null;
  anonima: boolean;
  stato: string;
  dinamica: string | null;
  impatto: string | null;
  inserito_da: string | null;
  preso_in_carico_da: string | null;
  preso_in_carico_il: string | null;
  created_at: string;
  presidio?: Presidio | null;
  unita?: UnitaOperativa | null;
  rca?: AnalisiRca | AnalisiRca[] | null;
  azioni?: AzioneCorrettiva[] | null;
}

export interface MovimentoEconomico {
  id: string;
  sinistro_id: string;
  tipo: string;
  importo: number;
  data_movimento: string | null;
  nota: string | null;
}

export interface Sinistro {
  id: string;
  azienda_id: string;
  presidio_id: string | null;
  unita_operativa_id: string | null;
  segnalazione_id: string | null;
  codice_interno: string | null;
  codice_simes: string | null;
  data_evento: string | null;
  data_denuncia: string | null;
  data_apertura: string | null;
  tipo_sinistro_codice: string | null;
  tipo_danno_codice: string | null;
  tipo_danneggiato_codice: string | null;
  fase_cura_codice: string | null;
  sentinella: boolean;
  denuncia_cautelativa: boolean;
  compagnia: string | null;
  sesso_danneggiato: "M" | "F" | null;
  eta_danneggiato: number | null;
  descrizione: string | null;
  stato: string;
  created_at: string;
  presidio?: Presidio | null;
  unita?: UnitaOperativa | null;
  movimenti?: MovimentoEconomico[] | null;
}

export interface FotografiaRischio {
  id: string;
  azienda_id: string;
  presidio_id: string | null;
  unita_operativa_id: string | null;
  modello_id: string | null;
  periodo_dal: string | null;
  periodo_al: string | null;
  stato: string;
  created_at: string;
  presidio?: Presidio | null;
  unita?: UnitaOperativa | null;
  modello?: { id: string; nome: string; versione: string } | null;
}

export interface VoceFotografia {
  id: string;
  fotografia_id: string;
  voce_modello_id: string | null;
  risposta: string | null;
  nota: string | null;
}

export interface VoceModello {
  id: string;
  modello_id: string;
  ordine: number;
  testo: string;
  area: string | null;
}

export interface EventoSentinella {
  id: string;
  azienda_id: string;
  presidio_id: string | null;
  unita_operativa_id: string | null;
  segnalazione_id: string | null;
  sinistro_id: string | null;
  tipo_codice: number;
  data_ora_evento: string | null;
  luogo_codice: string | null;
  sesso: "M" | "F" | null;
  anno_nascita: number | null;
  esito_codice: string | null;
  fonte_codice: string | null;
  scheda_a_inviata_il: string | null;
  scheda_b_inviata_il: string | null;
  metodo_analisi_codice: string | null;
  fattori_contribuenti: string | null;
  piano_azione: string | null;
  presidio?: Presidio | null;
  unita?: UnitaOperativa | null;
}

export interface FiltriAmbito {
  aziendaId?: string | null;
  presidioId?: string | null;
  unitaId?: string | null;
  anno?: string | null;
}

export interface Allegato {
  id: string;
  segnalazione_id: string | null;
  nome_file: string | null;
  url: string | null;
  created_at: string;
}

export interface PraticaLegale {
  id: string;
  sinistro_id: string;
  numero_pratica: string | null;
  foro: string | null;
  data_iscrizione: string | null;
  stato: string;
  rischio_soccombenza_codice: string | null;
  importo_preteso: number | null;
  importo_transatto: number | null;
  importo_liquidato: number | null;
  prossima_scadenza: string | null;
  created_at: string;
  sinistro?: { id: string; codice_interno: string | null; presidio_id: string | null } | null;
}

export interface AttivitaPresidio {
  id: string;
  presidio_id: string;
  anno: number;
  ricoveri: number | null;
  giornate_degenza: number | null;
}
