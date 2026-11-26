-- La policy rc3_pf_upd lascia ogni utente aggiornare la propria riga di profiles:
-- senza questo trigger un operatore potrebbe impostarsi ruolo = 'admin'.
-- Chi non è admin può cambiare sul proprio profilo solo il nome.
-- Il service_role (edge function) non ha auth.uid() e non è toccato.
create or replace function rischio_clinico.blocca_autopromozione()
returns trigger
language plpgsql
security definer
set search_path = rischio_clinico
as $$
begin
  if auth.uid() is not null
     and old.id = auth.uid()
     and not rischio_clinico.e_admin()
     and (new.id, new.ruolo, new.azienda_id, new.presidio_id, new.attivo, new.email)
         is distinct from
         (old.id, old.ruolo, old.azienda_id, old.presidio_id, old.attivo, old.email)
  then
    raise exception 'Non puoi modificare ruolo, ASL, presidio, stato o email del tuo profilo'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists blocca_autopromozione on rischio_clinico.profiles;
create trigger blocca_autopromozione
  before update on rischio_clinico.profiles
  for each row execute function rischio_clinico.blocca_autopromozione();
