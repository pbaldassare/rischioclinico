-- Campi mancanti e collegamenti automatici tra i moduli del backoffice.

-- 1. Sinistri: chi è il danneggiato e cosa è successo (servono al report sui grandi sinistri).
alter table rischio_clinico.sinistri
  add column if not exists sesso_danneggiato text check (sesso_danneggiato in ('M', 'F')),
  add column if not exists eta_danneggiato integer check (eta_danneggiato between 0 and 120),
  add column if not exists descrizione text;

-- 2. RCA: cause in 4 categorie fisse, contabili nella relazione annuale.
alter table rischio_clinico.analisi_rca
  add column if not exists cause text[] not null default '{}';

-- L'elenco fattore_rca non era usato dall'app: lo sostituisco con le 4 categorie richieste.
delete from rischio_clinico.classificazioni where tipo_elenco = 'fattore_rca';
insert into rischio_clinico.classificazioni (tipo_elenco, codice, etichetta, ordine) values
  ('fattore_rca', 'umane', 'Umane', 1),
  ('fattore_rca', 'organizzative', 'Organizzative', 2),
  ('fattore_rca', 'tecnologiche', 'Tecnologiche', 3),
  ('fattore_rca', 'procedurali', 'Procedurali', 4);

-- 3. Ricoveri e giornate di degenza per ospedale e anno: denominatore degli indicatori di frequenza.
create table if not exists rischio_clinico.attivita_presidio (
  id uuid primary key default gen_random_uuid(),
  presidio_id uuid not null references rischio_clinico.presidi (id) on delete cascade,
  anno integer not null check (anno between 2000 and 2100),
  ricoveri integer check (ricoveri >= 0),
  giornate_degenza integer check (giornate_degenza >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (presidio_id, anno)
);

create trigger set_updated_at before update on rischio_clinico.attivita_presidio
  for each row execute function rischio_clinico.set_updated_at();

alter table rischio_clinico.attivita_presidio enable row level security;
grant select, insert, update, delete on rischio_clinico.attivita_presidio to authenticated;

create policy rc3_ap_sel on rischio_clinico.attivita_presidio for select to authenticated
  using (exists (
    select 1 from rischio_clinico.presidi p
    where p.id = attivita_presidio.presidio_id and rischio_clinico.vede_presidio_riga(p.azienda_id, p.id)
  ));

create policy rc3_ap_all on rischio_clinico.attivita_presidio for all to authenticated
  using ((rischio_clinico.e_admin() or rischio_clinico.e_presidio()) and exists (
    select 1 from rischio_clinico.presidi p
    where p.id = attivita_presidio.presidio_id and rischio_clinico.vede_presidio_riga(p.azienda_id, p.id)
  ))
  with check ((rischio_clinico.e_admin() or rischio_clinico.e_presidio()) and exists (
    select 1 from rischio_clinico.presidi p
    where p.id = attivita_presidio.presidio_id and rischio_clinico.vede_presidio_riga(p.azienda_id, p.id)
  ));

-- 4. Segnalazione marcata sentinella -> scheda evento sentinella creata da sola.
-- security definer: l'operatore che segnala non ha accesso diretto agli eventi sentinella.
create or replace function rischio_clinico.crea_scheda_sentinella()
returns trigger
language plpgsql
security definer
set search_path = rischio_clinico
as $$
begin
  if new.sentinella
     and new.tipo_sentinella_codice is not null
     and not exists (select 1 from rischio_clinico.eventi_sentinella e where e.segnalazione_id = new.id)
  then
    insert into rischio_clinico.eventi_sentinella
      (azienda_id, presidio_id, unita_operativa_id, segnalazione_id, sinistro_id,
       tipo_codice, data_ora_evento, luogo_codice, fonte_codice)
    values
      (new.azienda_id, new.presidio_id, new.unita_operativa_id, new.id,
       (select s.id from rischio_clinico.sinistri s where s.segnalazione_id = new.id limit 1),
       new.tipo_sentinella_codice, new.data_ora_evento, new.luogo_codice, 'spontanea');
  end if;
  return new;
end;
$$;

drop trigger if exists crea_scheda_sentinella on rischio_clinico.segnalazioni;
create trigger crea_scheda_sentinella
  after insert or update of sentinella, tipo_sentinella_codice on rischio_clinico.segnalazioni
  for each row execute function rischio_clinico.crea_scheda_sentinella();

-- 5. Sinistro aperto da una segnalazione sentinella -> collegato alla sua scheda.
create or replace function rischio_clinico.collega_sinistro_sentinella()
returns trigger
language plpgsql
security definer
set search_path = rischio_clinico
as $$
begin
  if new.segnalazione_id is not null then
    update rischio_clinico.eventi_sentinella
       set sinistro_id = new.id
     where segnalazione_id = new.segnalazione_id and sinistro_id is null;
  end if;
  return new;
end;
$$;

drop trigger if exists collega_sinistro_sentinella on rischio_clinico.sinistri;
create trigger collega_sinistro_sentinella
  after insert or update of segnalazione_id on rischio_clinico.sinistri
  for each row execute function rischio_clinico.collega_sinistro_sentinella();
