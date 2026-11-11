-- IA en la nube: consentimiento y cupos diarios gratuitos.
-- Los cupos solo los toca el servidor (service role): el navegador no puede leerlos ni cambiarlos.
-- Las conversaciones NO se guardan aquí: se quedan en el dispositivo de cada usuaria.

-- Consentimiento explícito para enviar datos de salud al proveedor de IA
alter table public.profiles add column ai_consent_at timestamptz;

-- ---------------------------------------------------------- cupo por usuaria
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  kind    text not null check (kind in ('chat', 'advice')),
  count   integer not null default 0 check (count >= 0),
  primary key (user_id, day, kind)
);
alter table public.ai_usage enable row level security;

-- --------------------------------------------- cupo global del proveedor
-- Para no pasar nunca del plan gratuito del proveedor, y pausar si avisa de límite
create table public.ai_global_usage (
  day          date primary key,
  requests     integer not null default 0,
  tokens       integer not null default 0,
  paused_until timestamptz
);
alter table public.ai_global_usage enable row level security;

revoke all on public.ai_usage, public.ai_global_usage from anon, authenticated;

-- Reserva una consulta si queda cupo. Devuelve cuántas lleva tras reservar, o null si no queda.
create function public.ai_take(p_user uuid, p_day date, p_kind text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if p_limit <= 0 then
    return null;
  end if;
  insert into public.ai_usage as u (user_id, day, kind, count)
  values (p_user, p_day, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = u.count + 1
    where u.count < p_limit
  returning u.count into used;
  return used;
end;
$$;

-- Devuelve la consulta si el proveedor falló: no se pierde cupo por un error
create function public.ai_release(p_user uuid, p_day date, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage set count = greatest(count - 1, 0)
  where user_id = p_user and day = p_day and kind = p_kind;
$$;

-- Reserva una petición del cupo global. false si se ha llegado al tope o el proveedor pidió pausa.
create function public.ai_global_take(p_day date, p_max_requests integer, p_max_tokens integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ok boolean;
begin
  insert into public.ai_global_usage (day) values (p_day) on conflict (day) do nothing;
  update public.ai_global_usage
    set requests = requests + 1
    where day = p_day
      and requests < p_max_requests
      and tokens < p_max_tokens
      and (paused_until is null or paused_until <= now())
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

create function public.ai_global_tokens(p_day date, p_tokens integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_global_usage set tokens = tokens + greatest(p_tokens, 0) where day = p_day;
$$;

create function public.ai_global_pause(p_day date, p_until timestamptz)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_global_usage (day, paused_until) values (p_day, p_until)
  on conflict (day) do update set paused_until = greatest(coalesce(public.ai_global_usage.paused_until, p_until), p_until);
$$;

-- Solo el servidor puede usar estas funciones
revoke execute on function public.ai_take(uuid, date, text, integer) from public, anon, authenticated;
revoke execute on function public.ai_release(uuid, date, text) from public, anon, authenticated;
revoke execute on function public.ai_global_take(date, integer, integer) from public, anon, authenticated;
revoke execute on function public.ai_global_tokens(date, integer) from public, anon, authenticated;
revoke execute on function public.ai_global_pause(date, timestamptz) from public, anon, authenticated;
grant execute on function public.ai_take(uuid, date, text, integer) to service_role;
grant execute on function public.ai_release(uuid, date, text) to service_role;
grant execute on function public.ai_global_take(date, integer, integer) to service_role;
grant execute on function public.ai_global_tokens(date, integer) to service_role;
grant execute on function public.ai_global_pause(date, timestamptz) to service_role;
