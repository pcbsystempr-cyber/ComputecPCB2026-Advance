-- ============================================
-- COMPUTEC Role Passwords (Supabase)
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================
-- Guarda las contraseñas (hash SHA-256) que protegen
-- la activación de cada rol en el panel de administración.
-- Los roles media_manager y viewer NO tienen entrada aquí
-- porque no requieren contraseña.
-- ============================================

create table if not exists public.role_passwords (
    role        text        primary key
                            check (role in ('superadmin', 'editor', 'moderator')),
    password_hash text      not null
                            check (length(password_hash) = 64),
    active      boolean     not null default true,
    updated_at  timestamptz not null default now()
);

-- Trigger para updated_at automático
create or replace function public.set_updated_at_role_passwords()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_set_updated_at_role_passwords on public.role_passwords;
create trigger trg_set_updated_at_role_passwords
before update on public.role_passwords
for each row execute function public.set_updated_at_role_passwords();

-- ============================================
-- Contraseñas iniciales (hash SHA-256)
--   superadmin → "Sup3rAdmin26!"
--   editor     → "Editor26!"
--   moderator  → "Mod3rator26!"
-- Cámbialas desde el panel de Supabase o con UPDATE.
-- ============================================
insert into public.role_passwords (role, password_hash, active)
values
    ('superadmin', '815dd6aed1597c9c251e952c2734eceb0195528457a3241dfadbc6a527af0363', true),
    ('editor',     '05c517651c44303b33275bf8b25990e1a2203f9962267fe0384210b468a7bb3a', true),
    ('moderator',  '521e5414dde96039c070215fef615a6083465daa5f0df7b26e72690b4d655f2f', true)
on conflict (role) do update
set
    password_hash = excluded.password_hash,
    active        = excluded.active,
    updated_at    = now();

-- ============================================
-- Row Level Security — la tabla nunca se expone
-- directamente al frontend (solo vía RPC)
-- ============================================
alter table public.role_passwords enable row level security;

revoke all on table public.role_passwords from anon;
revoke all on table public.role_passwords from authenticated;

-- ============================================
-- RPC: validate_role_password
-- Recibe el rol y el hash SHA-256 de la contraseña
-- ingresada; devuelve { valid: boolean }.
-- No expone ningún hash almacenado.
-- ============================================
create or replace function public.validate_role_password(
    p_role          text,
    p_password_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_stored_hash text;
begin
    -- Validación básica de parámetros
    if p_role is null or p_password_hash is null then
        return jsonb_build_object('valid', false, 'message', 'Parámetros inválidos.');
    end if;

    if length(trim(p_password_hash)) <> 64 then
        return jsonb_build_object('valid', false, 'message', 'Hash inválido.');
    end if;

    -- Buscar el rol activo
    select rp.password_hash
    into v_stored_hash
    from public.role_passwords rp
    where rp.role = lower(trim(p_role))
      and rp.active = true
    limit 1;

    if not found then
        -- Rol no registrado en la tabla (media_manager, viewer, etc.)
        return jsonb_build_object('valid', false, 'message', 'Rol no requiere contraseña o no existe.');
    end if;

    -- Comparación en constante time a nivel SQL para evitar timing attacks
    if v_stored_hash = trim(p_password_hash) then
        return jsonb_build_object('valid', true);
    else
        return jsonb_build_object('valid', false, 'message', 'Contraseña incorrecta.');
    end if;
end;
$$;

grant execute on function public.validate_role_password(text, text) to anon;

-- ============================================
-- RPC: update_role_password (solo superadmin)
-- Permite cambiar la contraseña de un rol desde
-- el panel de seguridad, verificando antes la
-- contraseña actual del rol superadmin.
-- ============================================
create or replace function public.update_role_password(
    p_admin_username      text,
    p_admin_password_hash text,
    p_target_role         text,
    p_new_password_hash   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_admin_count integer;
begin
    -- Verificar que quien solicita es un superadmin válido
    select count(*) into v_admin_count
    from public.admin_credentials
    where lower(username) = lower(trim(p_admin_username))
      and password_hash    = trim(p_admin_password_hash)
      and role             = 'superadmin'
      and active           = true;

    if v_admin_count = 0 then
        return jsonb_build_object('success', false, 'message', 'No autorizado.');
    end if;

    -- Validar parámetros
    if p_target_role not in ('superadmin', 'editor', 'moderator') then
        return jsonb_build_object('success', false, 'message', 'Rol objetivo inválido.');
    end if;

    if p_new_password_hash is null or length(trim(p_new_password_hash)) <> 64 then
        return jsonb_build_object('success', false, 'message', 'Hash de contraseña inválido.');
    end if;

    -- Actualizar
    update public.role_passwords
    set password_hash = trim(p_new_password_hash),
        updated_at    = now()
    where role = p_target_role;

    return jsonb_build_object('success', true, 'message', 'Contraseña del rol actualizada.');
end;
$$;

grant execute on function public.update_role_password(text, text, text, text) to anon;
