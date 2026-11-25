-- =====================================================================
-- Annonce du changement de date : suivi des personnes déjà prévenues.
-- À exécuter une fois dans Supabase → SQL Editor (sans risque si relancé).
-- =====================================================================

-- Date d'envoi de l'annonce à chaque personne (null = pas encore prévenue).
alter table public.reservations
  add column if not exists date_change_notified_at timestamptz;

-- Accélère la recherche des personnes restant à prévenir.
create index if not exists reservations_date_change_pending_idx
  on public.reservations (created_at)
  where date_change_notified_at is null and status <> 'cancelled';

-- Demande à l'API de Supabase de prendre en compte la nouvelle colonne.
notify pgrst, 'reload schema';

-- Vérification : doit afficher une ligne « date_change_notified_at ».
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'reservations'
   and column_name = 'date_change_notified_at';
