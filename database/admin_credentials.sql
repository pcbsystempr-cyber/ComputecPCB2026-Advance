-- ============================================
-- COMPUTEC Admin Credentials Database (Supabase)
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

create extension if not exists pgcrypto;

create table if not exists public.admin_credentials (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    password_hash text not null,
    role text not null default 'superadmin' check (role in ('superadmin', 'editor', 'moderator', 'media_manager', 'viewer')),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at_admin_credentials()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_set_updated_at_admin_credentials on public.admin_credentials;
create trigger trg_set_updated_at_admin_credentials
before update on public.admin_credentials
for each row execute function public.set_updated_at_admin_credentials();

-- Usuario inicial por defecto:
-- username: AdminComputec26
-- password: hash SHA-256 = 775b37eedb61e25455992da2654617076927638bcda3bb26170e773a03f9cc2f
insert into public.admin_credentials (username, password_hash, role, active)
values ('AdminComputec26', '775b37eedb61e25455992da2654617076927638bcda3bb26170e773a03f9cc2f', 'superadmin', true)
on conflict (username) do update
set
        password_hash = excluded.password_hash,
        role = excluded.role,
        active = excluded.active,
        updated_at = now();

update public.admin_credentials
set
        username = 'AdminComputec26',
        password_hash = '775b37eedb61e25455992da2654617076927638bcda3bb26170e773a03f9cc2f',
        role = 'superadmin',
        active = true,
        updated_at = now()
where lower(username) = lower('Admin')
    and username <> 'AdminComputec26';

alter table public.admin_credentials enable row level security;

-- No exponer filas directas desde el frontend
revoke all on table public.admin_credentials from anon;
revoke all on table public.admin_credentials from authenticated;

-- RPC para validar login sin exponer password_hash
create or replace function public.validate_admin_login(
    p_username text,
    p_password_hash text
)
returns table (
    success boolean,
    username text,
    role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        true as success,
        c.username,
        c.role
    from public.admin_credentials c
    where lower(c.username) = lower(trim(p_username))
      and c.password_hash = p_password_hash
      and c.active = true
    limit 1;

    if not found then
        return query
        select false as success, null::text as username, null::text as role;
    end if;
end;
$$;

-- RPC para cambiar credenciales desde panel admin
create or replace function public.update_admin_credentials(
    p_current_username text,
    p_current_password_hash text,
    p_new_username text,
    p_new_password_hash text,
    p_new_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text;
    v_updated integer;
begin
    if p_new_username is null or length(trim(p_new_username)) < 3 then
        return jsonb_build_object('success', false, 'message', 'Usuario nuevo inválido.');
    end if;

    if p_new_password_hash is null or length(trim(p_new_password_hash)) < 64 then
        return jsonb_build_object('success', false, 'message', 'Hash de contraseña inválido.');
    end if;

    v_role := coalesce(nullif(trim(p_new_role), ''), 'superadmin');
    if v_role not in ('superadmin', 'editor', 'moderator', 'media_manager', 'viewer') then
        return jsonb_build_object('success', false, 'message', 'Rol inválido.');
    end if;

    update public.admin_credentials
    set
        username = trim(p_new_username),
        password_hash = trim(p_new_password_hash),
        role = v_role,
        updated_at = now()
    where lower(username) = lower(trim(p_current_username))
      and password_hash = trim(p_current_password_hash)
      and active = true;

    get diagnostics v_updated = row_count;

    if v_updated = 0 then
        return jsonb_build_object('success', false, 'message', 'Credenciales actuales incorrectas.');
    end if;

    return jsonb_build_object('success', true, 'updated', true, 'message', 'Credenciales actualizadas.');
exception
    when unique_violation then
        return jsonb_build_object('success', false, 'message', 'Ese nombre de usuario ya existe.');
end;
$$;

grant execute on function public.validate_admin_login(text, text) to anon;
grant execute on function public.update_admin_credentials(text, text, text, text, text) to anon;
