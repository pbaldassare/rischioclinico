-- Dati personali modificabili dall'operatore nel Profilo. La foto sta nel bucket pubblico `avatars`,
-- cartella <uid>/, già coperto dalle policy per-utente.
alter table rischio_clinico.profiles
  add column if not exists cognome text,
  add column if not exists telefono text,
  add column if not exists foto_url text;
