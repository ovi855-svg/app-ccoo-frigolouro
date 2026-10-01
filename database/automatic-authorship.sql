-- Applied through Supabase migration automatic_authorship_and_activity.
-- Existing records retain their original data and manual authorship; no backfill.
create schema if not exists private;
revoke all on schema private from public;

create table public.registro_actividad (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default clock_timestamp(),
  actor_id uuid,
  actor_name text not null,
  table_name text not null,
  record_id text not null,
  resource_table text not null,
  resource_id text not null,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  changed_fields text[] not null default '{}'
);
create index registro_actividad_resource_idx on public.registro_actividad(resource_table,resource_id,created_at desc,id);
alter table public.registro_actividad enable row level security;
revoke all on public.registro_actividad from public,anon,authenticated;
grant select on public.registro_actividad to authenticated;
create policy activity_members_read on public.registro_actividad for select to authenticated
using (exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active));

do $$
declare target text;
begin
  foreach target in array array['incidencias','metodos_items','salud_laboral','afiliados','gestiones_afiliados','historial_cambios','metodos_historial','historial_salud','importaciones_afiliacion'] loop
    execute format('alter table public.%I add column created_by uuid, add column created_by_name text, add column updated_by uuid, add column updated_by_name text, add column if not exists updated_at timestamptz',target);
  end loop;
end $$;

-- Invoker privileges: author comes from the verified JWT and protected membership.
-- Incoming author IDs/names cannot replace either the creator or the current actor.
create function private.stamp_app_author() returns trigger
language plpgsql security invoker set search_path='' as $$
declare actor uuid:=auth.uid(); actor_name text;
begin
  if actor is not null then
    select m.display_name into actor_name from public.app_members m where m.user_id=actor and m.active;
    if actor_name is null then raise exception 'Cuenta sin acceso autorizado' using errcode='42501'; end if;
  else
    if current_user in ('anon','authenticated') then raise exception 'Es necesario iniciar sesión' using errcode='42501'; end if;
    actor_name:='Administración sin sesión de usuario';
  end if;
  if tg_op='INSERT' then
    new.created_by:=actor; new.created_by_name:=actor_name;
    if tg_table_name in ('incidencias','metodos_items','salud_laboral') then new.creada_por:=actor_name; end if;
    if tg_table_name='importaciones_afiliacion' and actor is not null then new.user_id:=actor; end if;
  else
    new.created_by:=old.created_by; new.created_by_name:=old.created_by_name;
    if tg_table_name in ('incidencias','metodos_items','salud_laboral') then new.creada_por:=old.creada_por; end if;
    if tg_table_name='importaciones_afiliacion' then new.user_id:=old.user_id; end if;
  end if;
  new.updated_by:=actor; new.updated_by_name:=actor_name; new.updated_at:=clock_timestamp();
  return new;
end $$;
revoke all on function private.stamp_app_author() from public,anon,authenticated;

-- Definer is deliberately limited to appending the immutable log. It cannot be
-- called through the Data API; the parent write still uses its original RLS.
-- Only field names are logged, never copied affiliation values or descriptions.
create function private.log_app_activity() returns trigger
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); actor_name text; before_data jsonb; after_data jsonb; fields text[]; resource text; resource_id text; row_data jsonb;
begin
  if actor is not null then
    select m.display_name into actor_name from public.app_members m where m.user_id=actor and m.active;
    if actor_name is null then raise exception 'Cuenta sin acceso autorizado' using errcode='42501'; end if;
  else actor_name:='Administración sin sesión de usuario'; end if;
  before_data:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
  after_data:=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
  row_data:=case when tg_op='DELETE' then before_data else after_data end;
  select coalesce(array_agg(k order by k),'{}') into fields
    from (select jsonb_object_keys(before_data||after_data) k) keys
    where (before_data->k) is distinct from (after_data->k)
    and k<>all(array['id','created_at','created_by','created_by_name','updated_by','updated_by_name','updated_at','creada_por','dni_normalizado']);
  resource:=tg_table_name; resource_id:=row_data->>'id';
  if tg_table_name='gestiones_afiliados' then resource:='afiliados';resource_id:=row_data->>'afiliado_id';
  elsif tg_table_name='historial_cambios' then resource:='incidencias';resource_id:=row_data->>'incidencia_id';
  elsif tg_table_name='metodos_historial' then resource:='metodos_items';resource_id:=row_data->>'item_id';
  elsif tg_table_name='historial_salud' then resource:='salud_laboral';resource_id:=row_data->>'salud_id'; end if;
  insert into public.registro_actividad(actor_id,actor_name,table_name,record_id,resource_table,resource_id,operation,changed_fields)
    values(actor,actor_name,tg_table_name,row_data->>'id',resource,resource_id,tg_op,fields);
  return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function private.log_app_activity() from public,anon,authenticated;

do $$
declare target text;
begin
  foreach target in array array['incidencias','metodos_items','salud_laboral','afiliados','gestiones_afiliados','historial_cambios','metodos_historial','historial_salud','importaciones_afiliacion'] loop
    execute format('create trigger zz_stamp_app_author before insert or update on public.%I for each row execute function private.stamp_app_author()',target);
    execute format('create trigger log_app_activity after insert or update or delete on public.%I for each row execute function private.log_app_activity()',target);
  end loop;
end $$;
notify pgrst,'reload schema';
