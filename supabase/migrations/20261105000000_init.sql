-- Isla Mochi: esquema inicial.
-- Son datos de salud: cada usuaria solo puede leer y escribir sus propias filas (RLS).
-- Todo cuelga de auth.users con ON DELETE CASCADE: borrar la cuenta borra sus datos.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  name              text check (char_length(name) <= 80),
  avg_cycle_length  smallint not null default 28 check (avg_cycle_length between 15 and 90),
  avg_period_length smallint not null default 5  check (avg_period_length between 1 and 15),
  notify_email      boolean not null default false,
  notify_push       boolean not null default false,
  notify_frequency  text not null default 'phase_change'
                    check (notify_frequency in ('daily', 'phase_change')),
  timezone          text not null default 'Europe/Madrid',
  health_consent_at timestamptz,
  privacy_version   text,
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------- periods
create table public.periods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date   date,
  source     text not null default 'manual' check (source in ('manual', 'clue')),
  created_at timestamptz not null default now(),
  -- Reimportar desde Clue no duplica reglas
  unique (user_id, start_date),
  check (end_date is null or end_date >= start_date)
);

-- -------------------------------------------------------------- daily_logs
create table public.daily_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  symptoms   text[] not null default '{}',
  mood       text check (mood in ('genial', 'bien', 'normal', 'sensible', 'triste', 'irritable', 'ansiosa')),
  energy     smallint check (energy between 1 and 5),
  notes      text check (char_length(notes) <= 1000),
  source     text not null default 'manual' check (source in ('manual', 'clue')),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ------------------------------------------------------ push_subscriptions
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- -------------------------------------------------------- notification_log
-- Solo la usa el servidor. Evita enviar dos veces si el cron se reintenta y
-- guarda la fase avisada para detectar el cambio de fase.
create table public.notification_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  kind       text not null check (kind in ('daily', 'phase_change')),
  channel    text not null check (channel in ('email', 'push')),
  phase      text not null check (phase in ('menstrual', 'folicular', 'ovulatoria', 'lutea')),
  created_at timestamptz not null default now(),
  unique (user_id, date, kind, channel)
);

-- --------------------------------------------------------------------- RLS
alter table public.profiles           enable row level security;
alter table public.periods            enable row level security;
alter table public.daily_logs         enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_log   enable row level security;

-- La fila de perfil la crea el trigger y la borra la cascada: no hay INSERT ni DELETE
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "periods_all_own" on public.periods
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "daily_logs_all_own" on public.daily_logs
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- notification_log no tiene políticas a propósito: el navegador no puede tocarla.
-- La service role se salta RLS.

-- Nada para visitantes sin sesión
revoke all on public.profiles, public.periods, public.daily_logs,
              public.push_subscriptions, public.notification_log from anon;
revoke all on public.notification_log from authenticated;

-- ------------------------------------------------- perfil al registrarse
-- El consentimiento se marca en el formulario de registro y llega en los metadatos.
-- La fecha la pone el servidor, no el navegador.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  consent boolean := coalesce((new.raw_user_meta_data ->> 'health_consent')::boolean, false);
begin
  insert into public.profiles (id, name, health_consent_at, privacy_version)
  values (
    new.id,
    left(new.raw_user_meta_data ->> 'name', 80),
    case when consent then now() end,
    case when consent then new.raw_user_meta_data ->> 'privacy_version' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
