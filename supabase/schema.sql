-- DocSphere schema
-- Run this in the Supabase SQL Editor (once per project).
-- Do not use the service role key in the frontend.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (PIN metadata only; never store a raw PIN)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  pin_enabled boolean not null default false,
  pin_hash text,
  pin_salt text,
  pin_failed_attempts integer not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documents (metadata only — file bytes live in private Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null,
  description text check (description is null or char_length(description) <= 500),
  issue_date date,
  expiry_date date,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size integer not null check (file_size > 0 and file_size <= 10485760),
  original_filename text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  holder_name text check (holder_name is null or char_length(holder_name) <= 120),
  document_number_last4 text check (
    document_number_last4 is null or document_number_last4 ~ '^[A-Za-z0-9]{1,4}$'
  ),
  family_folder text not null default 'my_vault',
  pin_locked boolean not null default false,
  constraint documents_dates_ok check (
    issue_date is null or expiry_date is null or expiry_date >= issue_date
  )
);

alter table public.documents add column if not exists holder_name text;
alter table public.documents add column if not exists document_number_last4 text;
alter table public.documents add column if not exists family_folder text;
alter table public.documents add column if not exists pin_locked boolean;

update public.documents set family_folder = 'my_vault' where family_folder is null;
update public.documents set pin_locked = false where pin_locked is null;

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_user_category_idx on public.documents (user_id, category);
create index if not exists documents_user_expiry_idx on public.documents (user_id, expiry_date);
create index if not exists documents_user_folder_idx on public.documents (user_id, family_folder);
create index if not exists documents_user_holder_idx on public.documents (user_id, holder_name);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile row for every new auth user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security — users can only touch their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
on public.documents for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
on public.documents for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
on public.documents for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
on public.documents for delete
to authenticated
using (user_id = auth.uid());

-- PIN verify with lockout (hash compared server-side; raw PIN is not stored)
create or replace function public.verify_document_pin(p_pin_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.profiles%rowtype;
  max_attempts constant integer := 5;
  lock_minutes constant integer := 5;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into rec from public.profiles where id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;

  if rec.pin_enabled is not true or rec.pin_hash is null then
    return jsonb_build_object('ok', false, 'error', 'pin_not_enabled');
  end if;

  if rec.pin_locked_until is not null and rec.pin_locked_until > now() then
    return jsonb_build_object(
      'ok', false,
      'locked', true,
      'until', rec.pin_locked_until,
      'attempts', rec.pin_failed_attempts
    );
  end if;

  if rec.pin_hash = p_pin_hash then
    update public.profiles
    set pin_failed_attempts = 0, pin_locked_until = null
    where id = auth.uid();
    return jsonb_build_object('ok', true);
  end if;

  rec.pin_failed_attempts := rec.pin_failed_attempts + 1;

  if rec.pin_failed_attempts >= max_attempts then
    update public.profiles
    set
      pin_failed_attempts = rec.pin_failed_attempts,
      pin_locked_until = now() + (lock_minutes || ' minutes')::interval
    where id = auth.uid();

    return jsonb_build_object(
      'ok', false,
      'locked', true,
      'until', now() + (lock_minutes || ' minutes')::interval,
      'attempts', rec.pin_failed_attempts
    );
  end if;

  update public.profiles
  set pin_failed_attempts = rec.pin_failed_attempts, pin_locked_until = null
  where id = auth.uid();

  return jsonb_build_object(
    'ok', false,
    'locked', false,
    'remaining', max_attempts - rec.pin_failed_attempts,
    'attempts', rec.pin_failed_attempts
  );
end;
$$;

revoke all on function public.verify_document_pin(text) from public;
grant execute on function public.verify_document_pin(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

drop policy if exists "storage_documents_select_own" on storage.objects;
create policy "storage_documents_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_documents_insert_own" on storage.objects;
create policy "storage_documents_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "storage_documents_delete_own" on storage.objects;
create policy "storage_documents_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- No public read policy. Retrieval is via short-lived signed URLs created by the owner.

-- ---------------------------------------------------------------------------
-- Folder / category PIN locks (hashed only)
-- ---------------------------------------------------------------------------
create table if not exists public.vault_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lock_type text not null check (lock_type in ('folder', 'category')),
  lock_key text not null,
  pin_hash text not null,
  pin_salt text not null,
  created_at timestamptz not null default now(),
  unique (user_id, lock_type, lock_key)
);

alter table public.vault_locks enable row level security;

drop policy if exists "vault_locks_select_own" on public.vault_locks;
create policy "vault_locks_select_own"
on public.vault_locks for select to authenticated
using (user_id = auth.uid());

drop policy if exists "vault_locks_insert_own" on public.vault_locks;
create policy "vault_locks_insert_own"
on public.vault_locks for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "vault_locks_update_own" on public.vault_locks;
create policy "vault_locks_update_own"
on public.vault_locks for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "vault_locks_delete_own" on public.vault_locks;
create policy "vault_locks_delete_own"
on public.vault_locks for delete to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Self-destructing share links
-- ---------------------------------------------------------------------------
create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  token text not null unique,
  pin_hash text,
  signed_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists document_shares_token_idx on public.document_shares (token);
create index if not exists document_shares_expires_idx on public.document_shares (expires_at);

alter table public.document_shares enable row level security;

drop policy if exists "document_shares_select_own" on public.document_shares;
create policy "document_shares_select_own"
on public.document_shares for select to authenticated
using (user_id = auth.uid());

drop policy if exists "document_shares_insert_own" on public.document_shares;
create policy "document_shares_insert_own"
on public.document_shares for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "document_shares_delete_own" on public.document_shares;
create policy "document_shares_delete_own"
on public.document_shares for delete to authenticated
using (user_id = auth.uid());

create or replace function public.get_document_share(p_token text, p_pin_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.document_shares%rowtype;
  doc public.documents%rowtype;
begin
  delete from public.document_shares where expires_at <= now();

  select * into rec from public.document_shares where token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if rec.expires_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;

  if rec.pin_hash is not null then
    if p_pin_hash is null or p_pin_hash = '' then
      return jsonb_build_object('ok', false, 'error', 'pin_required', 'requires_pin', true);
    end if;
    if rec.pin_hash <> p_pin_hash then
      return jsonb_build_object('ok', false, 'error', 'bad_pin');
    end if;
  end if;

  select * into doc from public.documents where id = rec.document_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'name', doc.name,
    'category', doc.category,
    'holder_name', doc.holder_name,
    'document_number_last4', doc.document_number_last4,
    'issue_date', doc.issue_date,
    'expiry_date', doc.expiry_date,
    'signed_url', rec.signed_url,
    'mime_type', doc.mime_type,
    'expires_at', rec.expires_at
  );
end;
$$;

revoke all on function public.get_document_share(text, text) from public;
grant execute on function public.get_document_share(text, text) to anon, authenticated;
