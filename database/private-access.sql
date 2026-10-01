-- Access control only: existing union records are not changed.
-- Membership is maintained by the project administrator, never by the browser.
create table public.app_members (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null check (length(trim(display_name)) between 1 and 100),
    active boolean not null default true,
    created_at timestamptz not null default now()
);
alter table public.app_members enable row level security;
revoke all on public.app_members from public, anon, authenticated;
grant select on public.app_members to authenticated;
grant all on public.app_members to service_role;
create policy "Read own membership" on public.app_members
    for select to authenticated using (user_id = (select auth.uid()));

do $access$
declare
    table_name text;
    old_policy record;
begin
    foreach table_name in array array[
        'afiliados', 'gestiones_afiliados', 'incidencias', 'historial_cambios',
        'metodos_items', 'metodos_historial', 'salud_laboral', 'historial_salud'
    ] loop
        execute format('alter table public.%I enable row level security', table_name);
        for old_policy in select policyname from pg_policies
            where schemaname = 'public' and tablename = table_name
        loop
            execute format('drop policy %I on public.%I', old_policy.policyname, table_name);
        end loop;
        execute format('revoke all on public.%I from public, anon, authenticated', table_name);
        execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
        execute format(
            'create policy "Authorized members" on public.%I for all to authenticated '
            'using (exists (select 1 from public.app_members m '
            'where m.user_id = (select auth.uid()) and m.active)) '
            'with check (exists (select 1 from public.app_members m '
            'where m.user_id = (select auth.uid()) and m.active))', table_name
        );
    end loop;
end
$access$;

-- Identity sequences are needed for normal inserts, but not for setval or anonymous access.
revoke all on all sequences in schema public from public, anon, authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant usage on schema public to authenticated;

-- New tables must explicitly opt in to the Data API with RLS and grants.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
