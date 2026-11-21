-- Seed demo inventato per rischio_clinico (progetto gzuaxqxtfqmhhoafbmhm).
-- Due ASL fittizie: ASL Nord e ASL Costa. Nessun dato Messina / Papardo / Taormina / Patti.
-- Non tocca lo schema public. Date 2026, importi tondi finti. Rieseguibile.

begin;

delete from rischio_clinico.allegati;
delete from rischio_clinico.fotografie_voci;
delete from rischio_clinico.fotografie_rischio;
delete from rischio_clinico.movimenti_economici;
delete from rischio_clinico.pratiche_legali;
delete from rischio_clinico.eventi_sentinella;
delete from rischio_clinico.azioni_correttive;
delete from rischio_clinico.analisi_rca;
delete from rischio_clinico.assegnazioni_reparto;
delete from rischio_clinico.sinistri;
delete from rischio_clinico.segnalazioni;

update rischio_clinico.profiles
set azienda_id = null, presidio_id = null;

delete from rischio_clinico.unita_operative;
delete from rischio_clinico.presidi;
delete from rischio_clinico.aziende;

insert into rischio_clinico.aziende (id, codice_sis, nome, regione_codice, tipo)
values
  ('a0a0a0a0-0001-4000-8000-000000000001', 'N01', 'ASL Nord', null, 'asl'),
  ('a0a0a0a0-0001-4000-8000-000000000002', 'C01', 'ASL Costa', null, 'asl');

insert into rischio_clinico.presidi (id, azienda_id, codice_struttura, nome, posti_letto)
values
  ('b0b0b0b0-0001-4000-8000-000000000011', 'a0a0a0a0-0001-4000-8000-000000000001', 'ND01', 'Ospedale Collina', 250),
  ('b0b0b0b0-0001-4000-8000-000000000012', 'a0a0a0a0-0001-4000-8000-000000000001', 'ND02', 'Ospedale Pianura', 180),
  ('b0b0b0b0-0001-4000-8000-000000000013', 'a0a0a0a0-0001-4000-8000-000000000001', 'ND03', 'Ospedale Valle', 120),
  ('b0b0b0b0-0001-4000-8000-000000000021', 'a0a0a0a0-0001-4000-8000-000000000002', 'CS01', 'Ospedale Litorale', 220),
  ('b0b0b0b0-0001-4000-8000-000000000022', 'a0a0a0a0-0001-4000-8000-000000000002', 'CS02', 'Ospedale Porto', 160),
  ('b0b0b0b0-0001-4000-8000-000000000023', 'a0a0a0a0-0001-4000-8000-000000000002', 'CS03', 'Ospedale Isola', 90);

insert into rischio_clinico.unita_operative (id, presidio_id, nome, codice_disciplina)
select
  ('c0c0c0c0-0001-4000-8000-00000000' || p.cod || w.cod)::uuid,
  p.id,
  w.nome,
  w.disc
from (
  values
    ('b0b0b0b0-0001-4000-8000-000000000011'::uuid, '11'),
    ('b0b0b0b0-0001-4000-8000-000000000012'::uuid, '12'),
    ('b0b0b0b0-0001-4000-8000-000000000013'::uuid, '13'),
    ('b0b0b0b0-0001-4000-8000-000000000021'::uuid, '21'),
    ('b0b0b0b0-0001-4000-8000-000000000022'::uuid, '22'),
    ('b0b0b0b0-0001-4000-8000-000000000023'::uuid, '23')
) as p(id, cod)
cross join (
  values
    ('01', 'Pronto soccorso', 'PS'),
    ('02', 'Medicina', 'MED'),
    ('03', 'Chirurgia', 'CHI'),
    ('04', 'Ortopedia', 'ORT')
) as w(cod, nome, disc);

-- Admin vede entrambe le ASL. Ogni utente ASL vede solo la propria.
-- Un operatore per ASL, sul Pronto soccorso.
update rischio_clinico.profiles
set email = 'admin@demo.asl',
    nome = 'Admin Demo',
    ruolo = 'admin',
    attivo = true,
    azienda_id = null,
    presidio_id = null
where id = '44444444-4444-4444-4444-444444444447';

update rischio_clinico.profiles
set email = 'nord@demo.asl',
    nome = 'Marco Bianchi',
    ruolo = 'presidio',
    attivo = true,
    azienda_id = 'a0a0a0a0-0001-4000-8000-000000000001',
    presidio_id = null
where id = '44444444-4444-4444-4444-444444444442';

update rischio_clinico.profiles
set email = 'costa@demo.asl',
    nome = 'Lucia Verdi',
    ruolo = 'presidio',
    attivo = true,
    azienda_id = 'a0a0a0a0-0001-4000-8000-000000000002',
    presidio_id = null
where id = '44444444-4444-4444-4444-444444444443';

update rischio_clinico.profiles
set email = 'operatore.nord@demo.asl',
    nome = 'Anna Rossi',
    ruolo = 'operatore',
    attivo = true,
    azienda_id = 'a0a0a0a0-0001-4000-8000-000000000001',
    presidio_id = 'b0b0b0b0-0001-4000-8000-000000000011'
where id = '44444444-4444-4444-4444-444444444441';

update rischio_clinico.profiles
set email = 'operatore.costa@demo.asl',
    nome = 'Paolo Greco',
    ruolo = 'operatore',
    attivo = true,
    azienda_id = 'a0a0a0a0-0001-4000-8000-000000000002',
    presidio_id = 'b0b0b0b0-0001-4000-8000-000000000021'
where id = '44444444-4444-4444-4444-444444444444';

update rischio_clinico.profiles
set email = 'broker@demo.asl',
    nome = 'Alberto Di Piazza',
    ruolo = 'operatore',
    attivo = false,
    azienda_id = null,
    presidio_id = null
where id = '44444444-4444-4444-4444-444444444446';

update rischio_clinico.profiles
set email = 'regione@demo.asl',
    nome = 'Sara Neri',
    ruolo = 'operatore',
    attivo = false,
    azienda_id = null,
    presidio_id = null
where id = '44444444-4444-4444-4444-444444444445';

insert into rischio_clinico.assegnazioni_reparto (id, profile_id, unita_operativa_id, privilegi)
values
  (
    'aa000000-0001-4000-8000-000000000001',
    '44444444-4444-4444-4444-444444444441',
    'c0c0c0c0-0001-4000-8000-000000001101',
    array['segnalare', 'coda', 'fdr']::text[]
  ),
  (
    'aa000000-0001-4000-8000-000000000002',
    '44444444-4444-4444-4444-444444444444',
    'c0c0c0c0-0001-4000-8000-000000002101',
    array['segnalare', 'coda', 'fdr']::text[]
  );

-- Casi 2026: caduta, ritardo, near miss. Pochi, inventati.
insert into rischio_clinico.segnalazioni (
  id, azienda_id, presidio_id, unita_operativa_id,
  luogo_codice, data_ora_evento, tipo_evento_codice, gravita_codice, magnitudo_codice,
  fase_cura_codice, sentinella, tipo_sentinella_codice, anonima, stato, dinamica, impatto,
  inserito_da, preso_in_carico_da, preso_in_carico_il
) values
  (
    'd0d0d0d0-0001-4000-8000-000000000001',
    'a0a0a0a0-0001-4000-8000-000000000001',
    'b0b0b0b0-0001-4000-8000-000000000011',
    'c0c0c0c0-0001-4000-8000-000000001101',
    'pronto_soccorso', '2026-02-12 09:40:00+00', 'caduta', 'evento_sentinella', 'severo',
    'assistenza', true, 9, false, 'in_lavorazione',
    'Paziente cade dalla barella in attesa di triage al Pronto soccorso Collina.',
    'Trauma maggiore, trasferimento in degenza.',
    '44444444-4444-4444-4444-444444444441',
    '44444444-4444-4444-4444-444444444442',
    '2026-02-12 14:00:00+00'
  ),
  (
    'd0d0d0d0-0001-4000-8000-000000000002',
    'a0a0a0a0-0001-4000-8000-000000000001',
    'b0b0b0b0-0001-4000-8000-000000000012',
    'c0c0c0c0-0001-4000-8000-000000001202',
    'reparto_degenza', '2026-03-08 11:15:00+00', 'diagnosi', 'evento_avverso', 'moderato',
    'diagnosi', false, null, false, 'completata',
    'Ritardo nella lettura di un referto in Medicina Pianura: diagnosi corretta il giorno dopo.',
    'Prolungamento della degenza di 48 ore.',
    '44444444-4444-4444-4444-444444444442',
    '44444444-4444-4444-4444-444444444442',
    '2026-03-09 08:30:00+00'
  ),
  (
    'd0d0d0d0-0001-4000-8000-000000000003',
    'a0a0a0a0-0001-4000-8000-000000000001',
    'b0b0b0b0-0001-4000-8000-000000000011',
    'c0c0c0c0-0001-4000-8000-000000001103',
    'sala_operatoria', '2026-04-21 07:50:00+00', 'identificazione', 'near_miss', 'nessuno',
    'intervento', false, null, true, 'inviata',
    'Near miss in Chirurgia Collina: lato da operare indicato in modo errato sul braccialetto, intercettato in timeout.',
    'Nessun danno: procedura sospesa e ricontrollata.',
    '44444444-4444-4444-4444-444444444442',
    null,
    null
  ),
  (
    'd0d0d0d0-0001-4000-8000-000000000004',
    'a0a0a0a0-0001-4000-8000-000000000002',
    'b0b0b0b0-0001-4000-8000-000000000021',
    'c0c0c0c0-0001-4000-8000-000000002101',
    'pronto_soccorso', '2026-05-15 18:20:00+00', 'triage', 'evento_avverso', 'lieve',
    'diagnosi', false, null, false, 'in_lavorazione',
    'Ritardo di triage al Pronto soccorso Litorale in fascia serale, codice rivalutato in ritardo.',
    'Attesa prolungata, nessun danno permanente.',
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444443',
    '2026-05-16 09:00:00+00'
  ),
  (
    'd0d0d0d0-0001-4000-8000-000000000005',
    'a0a0a0a0-0001-4000-8000-000000000002',
    'b0b0b0b0-0001-4000-8000-000000000021',
    'c0c0c0c0-0001-4000-8000-000000002101',
    'pronto_soccorso', '2026-06-03 13:10:00+00', 'caduta', 'near_miss', 'nessuno',
    'assistenza', false, null, false, 'inviata',
    'Near miss: paziente instabile sul lettino del PS Litorale, caduta evitata dal personale.',
    'Nessun danno.',
    '44444444-4444-4444-4444-444444444444',
    null,
    null
  ),
  (
    'd0d0d0d0-0001-4000-8000-000000000006',
    'a0a0a0a0-0001-4000-8000-000000000002',
    'b0b0b0b0-0001-4000-8000-000000000022',
    'c0c0c0c0-0001-4000-8000-000000002204',
    'reparto_degenza', '2026-07-19 22:05:00+00', 'caduta', 'evento_avverso', 'lieve',
    'assistenza', false, null, false, 'completata',
    'Caduta notturna in Ortopedia Porto, paziente a terra accanto al letto.',
    'Contusione, nessuna frattura.',
    '44444444-4444-4444-4444-444444444443',
    '44444444-4444-4444-4444-444444444443',
    '2026-07-20 08:00:00+00'
  );

insert into rischio_clinico.analisi_rca (id, segnalazione_id, metodo_codice, p, m, r, fattori, note_audit)
values (
  'd1d1d1d1-0001-4000-8000-000000000001',
  'd0d0d0d0-0001-4000-8000-000000000001',
  'rca', 2, 3, 2,
  'Barella senza sponde, attesa prolungata, pavimento umido.',
  'Audit di reparto sul percorso triage.'
);

insert into rischio_clinico.azioni_correttive (
  id, segnalazione_id, descrizione, responsabile_id, scadenza, stato
) values (
  'd2d2d2d2-0001-4000-8000-000000000001',
  'd0d0d0d0-0001-4000-8000-000000000001',
  'Sponde laterali obbligatorie e briefing anti-caduta al cambio turno.',
  '44444444-4444-4444-4444-444444444442',
  '2026-04-30',
  'in_corso'
);

insert into rischio_clinico.sinistri (
  id, azienda_id, presidio_id, unita_operativa_id, segnalazione_id,
  codice_interno, data_evento, data_denuncia, data_apertura,
  tipo_sinistro_codice, tipo_danno_codice, tipo_danneggiato_codice, fase_cura_codice,
  sentinella, denuncia_cautelativa, compagnia, stato
) values
  (
    'e0e0e0e0-0001-4000-8000-000000000001',
    'a0a0a0a0-0001-4000-8000-000000000001',
    'b0b0b0b0-0001-4000-8000-000000000011',
    'c0c0c0c0-0001-4000-8000-000000001101',
    'd0d0d0d0-0001-4000-8000-000000000001',
    'SIN-2026-001', '2026-02-12', '2026-02-20', '2026-02-21',
    'caduta', 'medmal_lesioni', 'paziente', 'assistenza',
    true, false, 'Demo Assicurazioni', 'in_causa'
  ),
  (
    'e0e0e0e0-0001-4000-8000-000000000002',
    'a0a0a0a0-0001-4000-8000-000000000001',
    'b0b0b0b0-0001-4000-8000-000000000012',
    'c0c0c0c0-0001-4000-8000-000000001202',
    'd0d0d0d0-0001-4000-8000-000000000002',
    'SIN-2026-002', '2026-03-08', '2026-03-18', '2026-03-19',
    'diagnostico', 'medmal_lesioni', 'paziente', 'diagnosi',
    false, true, 'Demo Assicurazioni', 'in_riserva'
  ),
  (
    'e0e0e0e0-0001-4000-8000-000000000003',
    'a0a0a0a0-0001-4000-8000-000000000002',
    'b0b0b0b0-0001-4000-8000-000000000022',
    'c0c0c0c0-0001-4000-8000-000000002204',
    'd0d0d0d0-0001-4000-8000-000000000006',
    'SIN-2026-003', '2026-07-19', '2026-07-28', '2026-07-29',
    'caduta', 'rc_persone', 'paziente', 'assistenza',
    false, false, 'Demo Assicurazioni', 'liquidato'
  );

insert into rischio_clinico.movimenti_economici (id, sinistro_id, tipo, importo, data_movimento, nota)
values
  ('e1e1e1e1-0001-4000-8000-000000000011', 'e0e0e0e0-0001-4000-8000-000000000001', 'richiesto', 80000, '2026-02-20', 'Richiesta del legale'),
  ('e1e1e1e1-0001-4000-8000-000000000012', 'e0e0e0e0-0001-4000-8000-000000000001', 'riservato', 50000, '2026-02-21', 'Riserva iniziale'),
  ('e1e1e1e1-0001-4000-8000-000000000021', 'e0e0e0e0-0001-4000-8000-000000000002', 'riservato', 20000, '2026-03-19', 'Riserva su ritardo diagnostico'),
  ('e1e1e1e1-0001-4000-8000-000000000031', 'e0e0e0e0-0001-4000-8000-000000000003', 'liquidato', 15000, '2026-09-30', 'Liquidazione transattiva');

insert into rischio_clinico.eventi_sentinella (
  id, azienda_id, presidio_id, unita_operativa_id, segnalazione_id, sinistro_id,
  tipo_codice, data_ora_evento, luogo_codice, esito_codice, fonte_codice,
  scheda_a_inviata_il, metodo_analisi_codice, fattori_contribuenti, piano_azione
) values (
  'f0f0f0f0-0001-4000-8000-000000000001',
  'a0a0a0a0-0001-4000-8000-000000000001',
  'b0b0b0b0-0001-4000-8000-000000000011',
  'c0c0c0c0-0001-4000-8000-000000001101',
  'd0d0d0d0-0001-4000-8000-000000000001',
  'e0e0e0e0-0001-4000-8000-000000000001',
  9, '2026-02-12 09:40:00+00', 'pronto_soccorso', 'trauma_maggiore', 'spontanea',
  '2026-02-13', 'rca',
  'Sponde assenti, attesa, pavimento umido.',
  'Barriere laterali e formazione anti-caduta entro aprile 2026.'
);

insert into rischio_clinico.pratiche_legali (
  id, sinistro_id, numero_pratica, foro, data_iscrizione, stato,
  rischio_soccombenza_codice, importo_preteso, prossima_scadenza
) values (
  'f1f1f1f1-0001-4000-8000-000000000001',
  'e0e0e0e0-0001-4000-8000-000000000001',
  'RG 18/2026',
  'Tribunale Demo',
  '2026-04-10',
  'primo_grado',
  'medio',
  80000,
  '2026-09-15'
);

insert into rischio_clinico.fotografie_rischio (
  id, azienda_id, presidio_id, unita_operativa_id, modello_id,
  periodo_dal, periodo_al, stato, compilatore_id
) values (
  'f2f2f2f2-0001-4000-8000-000000000001',
  'a0a0a0a0-0001-4000-8000-000000000001',
  'b0b0b0b0-0001-4000-8000-000000000011',
  'c0c0c0c0-0001-4000-8000-000000001102',
  '77777777-7777-7777-7777-777777777771',
  '2026-01-01', '2026-03-31', 'completata',
  '44444444-4444-4444-4444-444444444442'
);

insert into rischio_clinico.fotografie_voci (id, fotografia_id, voce_modello_id, risposta, nota)
values
  (
    'f3f3f3f3-0001-4000-8000-000000000001',
    'f2f2f2f2-0001-4000-8000-000000000001',
    '13fc314a-63cf-44a2-a7a3-d0c81c429944',
    'si',
    'Braccialetto in uso.'
  ),
  (
    'f3f3f3f3-0001-4000-8000-000000000002',
    'f2f2f2f2-0001-4000-8000-000000000001',
    '93a04429-c38c-4709-94d6-e2619089738a',
    'parziale',
    'Protocollo cadute da aggiornare.'
  );

-- Auth: stessi id di profiles, password invariata DemoRischio2026!
update auth.users
set email = v.email,
    raw_user_meta_data = v.meta,
    updated_at = now()
from (
  values
    ('44444444-4444-4444-4444-444444444447'::uuid, 'admin@demo.asl', '{"nome":"Admin Demo","ruolo":"admin"}'::jsonb),
    ('44444444-4444-4444-4444-444444444442'::uuid, 'nord@demo.asl', '{"nome":"Marco Bianchi","ruolo":"presidio"}'::jsonb),
    ('44444444-4444-4444-4444-444444444443'::uuid, 'costa@demo.asl', '{"nome":"Lucia Verdi","ruolo":"presidio"}'::jsonb),
    ('44444444-4444-4444-4444-444444444441'::uuid, 'operatore.nord@demo.asl', '{"nome":"Anna Rossi","ruolo":"operatore"}'::jsonb),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'operatore.costa@demo.asl', '{"nome":"Paolo Greco","ruolo":"operatore"}'::jsonb)
) as v(id, email, meta)
where auth.users.id = v.id;

update auth.identities i
set identity_data = jsonb_set(coalesce(i.identity_data, '{}'::jsonb), '{email}', to_jsonb(u.email)),
    updated_at = now()
from auth.users u
where i.user_id = u.id
  and u.id in (
    '44444444-4444-4444-4444-444444444447',
    '44444444-4444-4444-4444-444444444442',
    '44444444-4444-4444-4444-444444444443',
    '44444444-4444-4444-4444-444444444441',
    '44444444-4444-4444-4444-444444444444'
  );

commit;
