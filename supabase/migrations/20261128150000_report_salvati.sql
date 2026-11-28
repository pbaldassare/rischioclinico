-- Report salvati: fotografia dei numeri di un ambito (filtri) in un momento, da riaprire ed esportare.
create table if not exists rischio_clinico.report (
  id uuid primary key default gen_random_uuid(),
  azienda_id uuid references rischio_clinico.aziende(id) on delete cascade,
  titolo text not null,
  ambito jsonb not null default '{}'::jsonb,
  dati jsonb not null,
  creato_da uuid references rischio_clinico.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table rischio_clinico.report enable row level security;
create policy rc3_rp_sel on rischio_clinico.report for select
  using (rischio_clinico.e_admin() or (rischio_clinico.e_presidio() and azienda_id = rischio_clinico.mia_azienda_id()));
create policy rc3_rp_ins on rischio_clinico.report for insert
  with check (rischio_clinico.e_admin() or (rischio_clinico.e_presidio() and azienda_id = rischio_clinico.mia_azienda_id()));
create policy rc3_rp_del on rischio_clinico.report for delete
  using (rischio_clinico.e_admin() or (rischio_clinico.e_presidio() and azienda_id = rischio_clinico.mia_azienda_id()));
grant select, insert, delete on rischio_clinico.report to authenticated;
