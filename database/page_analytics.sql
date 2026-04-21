-- ============================================
-- COMPUTEC: analítica de visitas al sitio público
-- Ejecuta en el SQL Editor de Supabase (mismo proyecto que admin_credentials).
-- Opcional: en Database > Replication, añade page_stats_daily al publication
-- "supabase_realtime" si quieres suscripciones en vivo más adelante.
-- ============================================

create table if not exists public.page_visit_events (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    visitor_id text,
    path text not null default '/'
);

create index if not exists idx_page_visit_events_created_at
    on public.page_visit_events (created_at desc);

create table if not exists public.page_stats_daily (
    stat_date date primary key,
    visit_count bigint not null default 0,
    updated_at timestamptz not null default now()
);

alter table public.page_visit_events enable row level security;
alter table public.page_stats_daily enable row level security;

revoke all on public.page_visit_events from anon, authenticated;
revoke all on public.page_stats_daily from anon, authenticated;

grant select on public.page_stats_daily to anon;

create policy "anon_read_daily_visit_stats"
    on public.page_stats_daily
    for select
    to anon
    using (true);

-- Registra una visita y suma +1 al día calendario en hora de Puerto Rico
create or replace function public.record_site_visit(
    p_path text default '/',
    p_visitor_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    d date := (timezone('America/Puerto_Rico', now()))::date;
    v_path text := left(coalesce(nullif(trim(p_path), ''), '/'), 512);
    v_vid text := left(coalesce(nullif(trim(p_visitor_id), ''), ''), 64);
begin
    if length(v_path) = 0 then
        v_path := '/';
    end if;

    insert into public.page_visit_events (path, visitor_id)
    values (v_path, nullif(v_vid, ''));

    insert into public.page_stats_daily (stat_date, visit_count, updated_at)
    values (d, 1, now())
    on conflict (stat_date) do update
    set visit_count = public.page_stats_daily.visit_count + 1,
        updated_at = now();
end;
$$;

grant execute on function public.record_site_visit(text, text) to anon;

-- Resumen agregado (sin exponer filas crudas de eventos)
create or replace function public.get_site_analytics_summary()
returns jsonb
language sql
security definer
set search_path = public
as $$
    with pr as (
        select (timezone('America/Puerto_Rico', now()))::date as today
    )
    select jsonb_build_object(
        'today_visits',
            coalesce((select visit_count from public.page_stats_daily d, pr where d.stat_date = pr.today), 0),
        'yesterday_visits',
            coalesce((select visit_count from public.page_stats_daily d, pr where d.stat_date = pr.today - 1), 0),
        'last7_total',
            coalesce((
                select sum(visit_count)::bigint
                from public.page_stats_daily d, pr
                where d.stat_date between pr.today - 6 and pr.today
            ), 0),
        'visits_last_hour',
            coalesce((
                select count(*)::int
                from public.page_visit_events e
                where e.created_at > now() - interval '1 hour'
            ), 0),
        'today_unique_visitors',
            coalesce((
                select count(distinct coalesce(nullif(trim(visitor_id), ''), id::text))
                from public.page_visit_events e, pr
                where (timezone('America/Puerto_Rico', e.created_at))::date = pr.today
            ), 0),
        'timezone',
            'America/Puerto_Rico',
        'generated_at',
            to_char(now() at time zone 'America/Puerto_Rico', 'YYYY-MM-DD"T"HH24:MI:SSOF')
    )
    from pr;
$$;

grant execute on function public.get_site_analytics_summary() to anon;
