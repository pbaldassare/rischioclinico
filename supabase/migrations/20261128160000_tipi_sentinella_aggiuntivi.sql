-- Eventi sentinella aggiuntivi oltre ai 23 del Ministero: li crea l'ASL (o l'Admin), li vedono tutti,
-- entrano nelle tendine e nell'assistente come gli altri. Codice progressivo dopo il 23.
alter table rischio_clinico.tipi_sentinella
  add column if not exists fonte text not null default 'ministero' check (fonte in ('ministero','aggiuntivo')),
  add column if not exists azienda_id uuid references rischio_clinico.aziende(id) on delete set null,
  add column if not exists descrizione text;
create policy rc3_sen_ins_asl on rischio_clinico.tipi_sentinella for insert
  with check (rischio_clinico.e_presidio() and fonte = 'aggiuntivo' and azienda_id = rischio_clinico.mia_azienda_id());
create policy rc3_sen_upd_asl on rischio_clinico.tipi_sentinella for update
  using (rischio_clinico.e_presidio() and fonte = 'aggiuntivo' and azienda_id = rischio_clinico.mia_azienda_id())
  with check (rischio_clinico.e_presidio() and fonte = 'aggiuntivo' and azienda_id = rischio_clinico.mia_azienda_id());
grant insert, update on rischio_clinico.tipi_sentinella to authenticated;
-- Il vincolo originale fermava i codici a 23: gli aggiuntivi proseguono da 24.
alter table rischio_clinico.tipi_sentinella drop constraint if exists tipi_sentinella_codice_check;
alter table rischio_clinico.tipi_sentinella add constraint tipi_sentinella_codice_check check (codice >= 1 and codice <= 999);
