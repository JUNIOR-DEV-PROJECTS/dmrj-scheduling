-- DMRJ Scheduling: impede conflitos simultâneos na agenda diretamente no banco.
-- Intervalos usam [): o horário final de um atendimento pode coincidir com o início do próximo.
-- Agendamentos cancelados não ocupam a agenda.

create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_no_professional_overlap
  exclude using gist (
    organization_id with =,
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status <> 'cancelled');
