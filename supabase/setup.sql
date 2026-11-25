-- =====================================================================
-- Workshop « L'IA au Service de l'Éducation Marocaine »
-- INSTALLATION COMPLÈTE DE LA BASE — fichier unique
--
-- Mode d'emploi : Supabase → SQL Editor → New query → coller TOUT ce
-- fichier → Run. Le résultat attendu est un tableau de 5 lignes
-- (les tables créées). Le script peut être relancé sans risque.
--
-- Contenu : tables, index, fonctions (places, liste d'attente, pointage),
-- sécurité (RLS), bucket de stockage des PDF, paramètres par défaut.
-- =====================================================================

-- citext : e-mails insensibles à la casse. Selon le projet Supabase, l'extension
-- se trouve dans le schéma « public » ou « extensions » : les fonctions ci-dessous
-- cherchent dans les deux.
create extension if not exists citext;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
do $$ begin
  create type public.reservation_status as enum ('confirmed', 'waitlist', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum ('pending', 'accepted', 'refused');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Paramètres modifiables sans redéploiement.
-- Une valeur vide ou absente = on utilise la variable d'environnement.
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('capacity', null),            -- ex. '150' (sinon EVENT_CAPACITY)
  ('submission_deadline', null)  -- ex. '2026-12-20T23:59:59+01:00' (sinon PROJECT_SUBMISSION_DEADLINE)
on conflict (key) do nothing;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null,
  prenom text not null,
  email citext not null,
  telephone text not null,
  statut text not null check (statut in (
    'etudiant_esef', 'etudiant_autre', 'enseignant', 'inspecteur', 'professionnel', 'autre'
  )),
  etablissement text not null,
  filiere text,
  source text,
  locale text not null default 'fr' check (locale in ('fr', 'ar')),
  status public.reservation_status not null,
  ticket_token uuid not null unique default gen_random_uuid(),
  cancel_token uuid not null unique default gen_random_uuid(),
  checked_in_at timestamptz,
  promoted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

-- Une seule réservation active par adresse e-mail (insensible à la casse).
-- Une réservation annulée libère l'adresse.
create unique index if not exists reservations_email_active_key
  on public.reservations (email)
  where status <> 'cancelled';

create index if not exists reservations_status_created_idx
  on public.reservations (status, created_at);

-- Annonce du changement de date : date d'envoi à chaque personne
-- (null = pas encore prévenue).
alter table public.reservations
  add column if not exists date_change_notified_at timestamptz;

create index if not exists reservations_date_change_pending_idx
  on public.reservations (created_at)
  where date_change_notified_at is null and status <> 'cancelled';

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  porteur_nom text not null,
  porteur_email citext not null,
  porteur_telephone text not null,
  etablissement text not null,
  titre text not null,
  categorie text not null check (categorie in (
    'apprentissage_personnalise', 'evaluation_feedback', 'accessibilite_inclusion',
    'gestion_orientation', 'ressources_numeriques', 'autre'
  )),
  problematique text not null,
  solution text not null,
  technologies text not null,
  avancement text not null check (avancement in ('idee', 'prototype', 'finalise')),
  lien text,
  pdf_path text,
  format text not null check (format in ('oral', 'poster', 'demo')),
  locale text not null default 'fr' check (locale in ('fr', 'ar')),
  status public.project_status not null default 'pending',
  admin_comment text,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now()
);

create index if not exists projects_status_created_idx
  on public.projects (status, created_at);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  nom text not null,
  position smallint not null default 0
);

create index if not exists team_members_project_idx
  on public.team_members (project_id, position);

-- Compteurs pour la limitation de débit (anti-spam).
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------
-- Sécurité : RLS activée partout, aucun accès direct pour le public.
-- Toutes les écritures passent par le serveur Next.js (clé secrète),
-- qui applique validation, honeypot, limitation de débit et contrôle
-- de capacité. Seuls les administrateurs (vérifiés côté serveur via
-- ADMIN_EMAILS) lisent les données.
-- ---------------------------------------------------------------------
alter table public.settings      enable row level security;
alter table public.reservations  enable row level security;
alter table public.projects      enable row level security;
alter table public.team_members  enable row level security;
alter table public.rate_limits   enable row level security;

revoke all on public.settings, public.reservations, public.projects,
  public.team_members, public.rate_limits from anon, authenticated;

-- ---------------------------------------------------------------------
-- Fonctions
-- ---------------------------------------------------------------------

-- Capacité effective : table settings, sinon valeur par défaut fournie.
create or replace function public.effective_capacity(p_default_capacity integer)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  select greatest(0, coalesce(
    (select nullif(trim(value), '')::integer from settings where key = 'capacity'),
    p_default_capacity
  ));
$$;

-- Compteur public (places restantes). Ne renvoie aucune donnée personnelle.
create or replace function public.get_seat_stats(p_default_capacity integer default 150)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_capacity integer := effective_capacity(p_default_capacity);
  v_confirmed integer;
  v_waitlist integer;
begin
  select count(*) filter (where status = 'confirmed'),
         count(*) filter (where status = 'waitlist')
    into v_confirmed, v_waitlist
    from reservations;

  return jsonb_build_object(
    'capacity', v_capacity,
    'confirmed', v_confirmed,
    'waitlist', v_waitlist,
    'remaining', greatest(0, v_capacity - v_confirmed)
  );
end;
$$;

-- Génère un code de réservation lisible (sans 0/O, 1/I/L).
create or replace function public.generate_reservation_code()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select 'IAE-' || string_agg(
             substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1), '')
      into v_code
      from generate_series(1, 6);
    exit when not exists (select 1 from reservations where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Réservation d'une place, sûre face aux accès concurrents :
-- un verrou consultatif sérialise le comptage et l'insertion.
create or replace function public.reserve_seat(
  p_nom text,
  p_prenom text,
  p_email text,
  p_telephone text,
  p_statut text,
  p_etablissement text,
  p_filiere text,
  p_source text,
  p_locale text,
  p_default_capacity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_capacity integer;
  v_confirmed integer;
  v_status reservation_status;
  v_row reservations;
  v_position integer := null;
begin
  perform pg_advisory_xact_lock(hashtext('workshop_seats'));

  if exists (
    select 1 from reservations
     where email = p_email::citext and status <> 'cancelled'
  ) then
    return jsonb_build_object('ok', false, 'error', 'email_taken');
  end if;

  v_capacity := effective_capacity(p_default_capacity);
  select count(*) into v_confirmed from reservations where status = 'confirmed';

  v_status := case when v_confirmed < v_capacity then 'confirmed' else 'waitlist' end;

  insert into reservations (
    code, nom, prenom, email, telephone, statut, etablissement,
    filiere, source, locale, status
  ) values (
    generate_reservation_code(), p_nom, p_prenom, p_email::citext, p_telephone,
    p_statut, p_etablissement, nullif(p_filiere, ''), nullif(p_source, ''),
    coalesce(p_locale, 'fr'), v_status
  )
  returning * into v_row;

  if v_status = 'waitlist' then
    select count(*) into v_position
      from reservations
     where status = 'waitlist' and created_at <= v_row.created_at;
  end if;

  return jsonb_build_object(
    'ok', true,
    'reservation', to_jsonb(v_row),
    'waitlist_position', v_position
  );
end;
$$;

-- Promeut les premières personnes de la liste d'attente tant qu'il reste des places.
create or replace function public.promote_waitlist(p_default_capacity integer)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_capacity integer;
  v_confirmed integer;
  v_free integer;
  v_promoted jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('workshop_seats'));

  v_capacity := effective_capacity(p_default_capacity);
  select count(*) into v_confirmed from reservations where status = 'confirmed';
  v_free := greatest(0, v_capacity - v_confirmed);

  with next_in_line as (
    select id from reservations
     where status = 'waitlist'
     order by created_at asc
     limit v_free
  ), updated as (
    update reservations r
       set status = 'confirmed', promoted_at = now()
      from next_in_line n
     where r.id = n.id
    returning r.*
  )
  select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb) into v_promoted from updated u;

  return v_promoted;
end;
$$;

-- Annulation via le lien unique : libère la place et promeut la liste d'attente.
create or replace function public.cancel_reservation(
  p_cancel_token uuid,
  p_default_capacity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row reservations;
begin
  perform pg_advisory_xact_lock(hashtext('workshop_seats'));

  select * into v_row from reservations where cancel_token = p_cancel_token;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_row.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'error', 'already_cancelled');
  end if;

  update reservations
     set status = 'cancelled', cancelled_at = now()
   where id = v_row.id
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'reservation', to_jsonb(v_row),
    'promoted', promote_waitlist(p_default_capacity)
  );
end;
$$;

-- Pointage le jour J à partir du code du billet (QR).
create or replace function public.check_in(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row reservations;
begin
  select * into v_row from reservations
   where code = upper(trim(p_code))
   for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  if v_row.status = 'cancelled' then
    return jsonb_build_object('result', 'cancelled', 'reservation', to_jsonb(v_row));
  end if;

  if v_row.status = 'waitlist' then
    return jsonb_build_object('result', 'waitlist', 'reservation', to_jsonb(v_row));
  end if;

  if v_row.checked_in_at is not null then
    return jsonb_build_object('result', 'already', 'reservation', to_jsonb(v_row));
  end if;

  update reservations set checked_in_at = now() where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('result', 'ok', 'reservation', to_jsonb(v_row));
end;
$$;

-- Dépôt d'un projet et de son équipe en une seule transaction.
create or replace function public.submit_project(p_project jsonb, p_members text[])
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row projects;
  v_member text;
  v_position smallint := 0;
begin
  if coalesce(array_length(p_members, 1), 0) > 5 then
    raise exception 'too_many_members';
  end if;

  insert into projects (
    porteur_nom, porteur_email, porteur_telephone, etablissement, titre,
    categorie, problematique, solution, technologies, avancement, lien,
    pdf_path, format, locale
  ) values (
    p_project->>'porteur_nom',
    (p_project->>'porteur_email')::citext,
    p_project->>'porteur_telephone',
    p_project->>'etablissement',
    p_project->>'titre',
    p_project->>'categorie',
    p_project->>'problematique',
    p_project->>'solution',
    p_project->>'technologies',
    p_project->>'avancement',
    nullif(p_project->>'lien', ''),
    nullif(p_project->>'pdf_path', ''),
    p_project->>'format',
    coalesce(p_project->>'locale', 'fr')
  )
  returning * into v_row;

  foreach v_member in array coalesce(p_members, '{}'::text[]) loop
    if length(trim(v_member)) > 0 then
      insert into team_members (project_id, nom, position)
      values (v_row.id, trim(v_member), v_position);
      v_position := v_position + 1;
    end if;
  end loop;

  return to_jsonb(v_row);
end;
$$;

-- Limitation de débit à fenêtre fixe. Renvoie false si la limite est dépassée.
create or replace function public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_count integer;
begin
  insert into rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
  do update set count = rate_limits.count + 1
  returning rate_limits.count into v_count;

  -- Ménage occasionnel des anciennes fenêtres.
  if random() < 0.02 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;

-- ---------------------------------------------------------------------
-- Droits d'exécution : tout est réservé au serveur (service_role),
-- sauf le compteur public de places.
-- ---------------------------------------------------------------------
revoke execute on function
  public.effective_capacity(integer),
  public.generate_reservation_code(),
  public.reserve_seat(text, text, text, text, text, text, text, text, text, integer),
  public.promote_waitlist(integer),
  public.cancel_reservation(uuid, integer),
  public.check_in(text),
  public.submit_project(jsonb, text[]),
  public.check_rate_limit(text, integer, integer),
  public.get_seat_stats(integer)
from public, anon, authenticated;

grant execute on function
  public.effective_capacity(integer),
  public.generate_reservation_code(),
  public.reserve_seat(text, text, text, text, text, text, text, text, text, integer),
  public.promote_waitlist(integer),
  public.cancel_reservation(uuid, integer),
  public.check_in(text),
  public.submit_project(jsonb, text[]),
  public.check_rate_limit(text, integer, integer),
  public.get_seat_stats(integer)
to service_role;

grant execute on function public.get_seat_stats(integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Stockage : bucket privé pour les PDF des projets (10 Mo, PDF seulement).
-- Aucun accès public : dépôt par URL signée, lecture par l'admin.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- Finalisation
-- ---------------------------------------------------------------------

-- Demande à l'API de Supabase de prendre en compte les nouvelles tables
-- et fonctions immédiatement.
notify pgrst, 'reload schema';

-- Vérification : doit afficher 5 lignes, toutes avec rls_active = true.
select c.relname as table_name, c.relrowsecurity as rls_active
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relkind = 'r'
   and c.relname in ('settings', 'reservations', 'projects', 'team_members', 'rate_limits')
 order by c.relname;
