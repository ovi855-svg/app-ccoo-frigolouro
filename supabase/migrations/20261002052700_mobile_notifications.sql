-- Mobile notifications. Only other active members receive activity alerts.
-- Secrets are generated at runtime and encrypted in Vault; never committed.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create table public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 push_enabled boolean not null default true,
 incidencias boolean not null default true,
 metodos boolean not null default true,
 salud boolean not null default true,
 afiliacion boolean not null default true,
 snoozed_until timestamptz
);
create table public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique check (
  length(endpoint) between 20 and 2048 and
  endpoint ~ '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)?push\.services\.mozilla\.com|web\.push\.apple\.com|([a-z0-9-]+\.)?notify\.windows\.com)(:443)?/[^[:space:]#]+$'
 ),
 p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]{87}=?$'),
 auth text not null check (auth ~ '^[A-Za-z0-9_-]{22}(==)?$'),
 created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid,
 actor_name text not null,
 category text not null check(category in ('incidencias','metodos','salud','afiliacion')),
 message text not null,
 href text not null,
 created_at timestamptz not null default now(),
 read_at timestamptz,
 check (actor_id is null or recipient_id<>actor_id)
);
create index notifications_recipient_date_idx on public.notifications(recipient_id,created_at desc,id);
create index notifications_unread_idx on public.notifications(recipient_id) where read_at is null;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
revoke all on public.notifications,public.notification_preferences,public.push_subscriptions from public,anon,authenticated;
grant select,update(read_at) on public.notifications to authenticated;
grant select,insert,update,delete on public.notification_preferences,public.push_subscriptions to authenticated;
grant all on public.notifications,public.notification_preferences,public.push_subscriptions to service_role;
create policy notifications_read on public.notifications for select to authenticated
 using(recipient_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active));
create policy notifications_mark_read on public.notifications for update to authenticated
 using(recipient_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active))
 with check(recipient_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active));
create policy preferences_own on public.notification_preferences for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active));
create policy subscriptions_own on public.push_subscriptions for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.app_members m where m.user_id=(select auth.uid()) and m.active));

create table private.notification_events (
 id uuid primary key default gen_random_uuid(),
 transaction_id text not null,
 actor_id uuid,
 actor_key text not null,
 actor_name text not null,
 table_name text not null,
 resource_id text not null,
 category text not null,
 operation text not null,
 created_at timestamptz not null default clock_timestamp(),
 unique(transaction_id,actor_key,table_name,resource_id)
);
create table private.notification_deliveries (
 id uuid primary key default gen_random_uuid(),
 notification_id uuid not null references public.notifications(id) on delete cascade,
 subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
 attempts integer not null default 0,
 available_at timestamptz not null default now(),
 lease_until timestamptz,
 last_status integer,
 created_at timestamptz not null default now(),
 unique(notification_id,subscription_id)
);
create index notification_deliveries_pending_idx on private.notification_deliveries(available_at) where attempts<5;
alter table private.notification_events enable row level security;
alter table private.notification_deliveries enable row level security;
revoke all on private.notification_events,private.notification_deliveries from public,anon,authenticated,service_role;

create function private.queue_app_notification() returns trigger
 language plpgsql security definer set search_path='' as $$
declare category text;
begin
 -- History writes accompany parent updates: do not alert twice for one edit.
 if new.table_name not in ('incidencias','metodos_items','salud_laboral','afiliados','gestiones_afiliados','importaciones_afiliacion') then return new; end if;
 if new.operation='UPDATE' and cardinality(new.changed_fields)=0 then return new; end if;
 category:=case new.resource_table when 'incidencias' then 'incidencias' when 'metodos_items' then 'metodos'
   when 'salud_laboral' then 'salud' else 'afiliacion' end;
 insert into private.notification_events(transaction_id,actor_id,actor_key,actor_name,table_name,resource_id,category,operation)
 values(pg_current_xact_id()::text,new.actor_id,coalesce(new.actor_id::text,'administracion'),new.actor_name,new.table_name,new.resource_id,category,new.operation)
 on conflict(transaction_id,actor_key,table_name,resource_id) do update set
 operation=case when private.notification_events.operation='INSERT' then 'INSERT' else excluded.operation end;
 return new;
end $$;
revoke all on function private.queue_app_notification() from public,anon,authenticated,service_role;
create trigger queue_app_notification after insert on public.registro_actividad for each row execute function private.queue_app_notification();

create function private.flush_app_notifications() returns integer
 language plpgsql security definer set search_path='' as $$
declare batch record; member record; notification uuid; msg text; path text; total integer:=0;
begin
 -- A single short transaction handles the committed queue, including entire imports.
 lock table private.notification_events in share row exclusive mode;
 for batch in
  select e.actor_id,e.actor_name,e.category,
   case when exists(select 1 from private.notification_events i where i.transaction_id=e.transaction_id and i.table_name='importaciones_afiliacion')
     then 'import:'||e.transaction_id else e.category||':'||e.resource_id end as group_key,
   bool_or(e.table_name='importaciones_afiliacion') as is_import,
   bool_or(e.operation='DELETE') as deleted,
   bool_or(e.operation='INSERT' and e.table_name<>'gestiones_afiliados') as is_new,
   max(e.resource_id) as resource_id,count(*) as changes
  from private.notification_events e group by 1,2,3,4
 loop
  path:=case batch.category when 'incidencias' then '/orden-del-dia' when 'metodos' then '/metodos-tiempos' when 'salud' then '/salud-laboral' else '/afiliados' end;
  if batch.is_import then msg:='Listado de afiliación actualizado mediante una importación.';
  else
   msg:=case batch.category
    when 'incidencias' then case when batch.deleted then 'Incidencia eliminada.' when batch.is_new then 'Nueva incidencia.' else 'Incidencia actualizada.' end
    when 'metodos' then case when batch.deleted then 'Solicitud de métodos y tiempos eliminada.' when batch.is_new then 'Nueva solicitud de métodos y tiempos.' else 'Solicitud de métodos y tiempos actualizada.' end
    when 'salud' then case when batch.deleted then 'Registro de salud laboral eliminado.' when batch.is_new then 'Nuevo registro de salud laboral.' else 'Registro de salud laboral actualizado.' end
    else case when batch.deleted then 'Cambio en una ficha de afiliación.' when batch.is_new then 'Nueva ficha de afiliación.' else 'Ficha o gestión de afiliación actualizada.' end end;
   if not batch.deleted then path:=path||'#registro-'||batch.resource_id; end if;
  end if;
  for member in select m.user_id from public.app_members m where m.active and m.user_id is distinct from batch.actor_id loop
   insert into public.notifications(recipient_id,actor_id,actor_name,category,message,href)
    values(member.user_id,batch.actor_id,batch.actor_name,batch.category,msg,path) returning id into notification;
   insert into private.notification_deliveries(notification_id,subscription_id)
    select notification,s.id from public.push_subscriptions s
    left join public.notification_preferences p on p.user_id=s.user_id
    where s.user_id=member.user_id and coalesce(p.push_enabled,true)
     and (p.snoozed_until is null or p.snoozed_until<=now())
     and case batch.category when 'incidencias' then coalesce(p.incidencias,true) when 'metodos' then coalesce(p.metodos,true)
       when 'salud' then coalesce(p.salud,true) else coalesce(p.afiliacion,true) end;
   total:=total+1;
  end loop;
 end loop;
 delete from private.notification_events;
 return total;
end $$;
revoke all on function private.flush_app_notifications() from public,anon,authenticated,service_role;

-- The worker receives its credentials through a service-role-only RPC.
do $$ begin
 if not exists(select 1 from vault.secrets where name='union_push_job_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'union_push_job_token');
 end if;
end $$;
create function private.notification_worker_config(p_public text default null,p_private text default null) returns jsonb
 language plpgsql security definer set search_path='' as $$
begin
 if (select auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Worker only' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(58741981);
 if p_public is not null and p_private is not null and not exists(select 1 from vault.secrets where name='union_push_public_key') then
  if p_public !~ '^[A-Za-z0-9_-]{87}$' or p_private !~ '^[A-Za-z0-9_-]{43}$' then raise exception 'Invalid keys'; end if;
  perform vault.create_secret(p_public,'union_push_public_key');
  perform vault.create_secret(p_private,'union_push_private_key');
 end if;
 return jsonb_build_object(
 'publicKey',(select decrypted_secret from vault.decrypted_secrets where name='union_push_public_key'),
 'privateKey',(select decrypted_secret from vault.decrypted_secrets where name='union_push_private_key'),
 'jobToken',(select decrypted_secret from vault.decrypted_secrets where name='union_push_job_token'));
end $$;
create function public.notification_worker_config(p_public text default null,p_private text default null) returns jsonb
 language sql security invoker set search_path='' as $$ select private.notification_worker_config(p_public,p_private) $$;
revoke all on function private.notification_worker_config(text,text),public.notification_worker_config(text,text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.notification_worker_config(text,text),public.notification_worker_config(text,text) to service_role;

create function private.claim_notification_deliveries() returns jsonb
 language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if (select auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Worker only' using errcode='42501'; end if;
 -- Revoked members, read notices and muted/category-disabled alerts never get sent.
 delete from private.notification_deliveries d using public.notifications n,public.push_subscriptions s
 where d.notification_id=n.id and d.subscription_id=s.id and
 (n.read_at is not null or d.created_at<now()-interval '24 hours' or
  not exists(select 1 from public.app_members m where m.user_id=s.user_id and m.active) or
  exists(select 1 from public.notification_preferences p where p.user_id=s.user_id and
   (not p.push_enabled or p.snoozed_until>now() or
    not case n.category when 'incidencias' then p.incidencias when 'metodos' then p.metodos when 'salud' then p.salud else p.afiliacion end)));
 with picked as (
  select d.id from private.notification_deliveries d where d.attempts<5 and d.available_at<=now()
   and (d.lease_until is null or d.lease_until<now()) order by d.created_at for update skip locked limit 40
 ), claimed as (
  update private.notification_deliveries d set attempts=d.attempts+1,lease_until=now()+interval '2 minutes'
   from picked where d.id=picked.id returning d.*
 )
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'notificationId',n.id,'subscriptionId',s.id,'endpoint',s.endpoint,
 'p256dh',s.p256dh,'auth',s.auth,'category',n.category,'href',n.href)),'[]') into result
 from claimed c join public.notifications n on n.id=c.notification_id join public.push_subscriptions s on s.id=c.subscription_id;
 return result;
end $$;
create function public.claim_notification_deliveries() returns jsonb
 language sql security invoker set search_path='' as $$ select private.claim_notification_deliveries() $$;
create function private.finish_notification_delivery(p_id uuid,p_status integer) returns void
 language plpgsql security definer set search_path='' as $$
begin
 if (select auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'Worker only' using errcode='42501'; end if;
 if p_status in (404,410) then
  delete from public.push_subscriptions where id=(select subscription_id from private.notification_deliveries where id=p_id);
 elsif p_status between 200 and 299 then delete from private.notification_deliveries where id=p_id;
 else
  update private.notification_deliveries set last_status=p_status,lease_until=null,
   available_at=now()+make_interval(secs=>least(1800,60*power(2,attempts)::integer)) where id=p_id;
 end if;
end $$;
create function public.finish_notification_delivery(p_id uuid,p_status integer) returns void
 language sql security invoker set search_path='' as $$ select private.finish_notification_delivery(p_id,p_status) $$;
revoke all on function private.claim_notification_deliveries(),public.claim_notification_deliveries(),
 private.finish_notification_delivery(uuid,integer),public.finish_notification_delivery(uuid,integer) from public,anon,authenticated;
grant execute on function private.claim_notification_deliveries(),public.claim_notification_deliveries(),
 private.finish_notification_delivery(uuid,integer),public.finish_notification_delivery(uuid,integer) to service_role;

create function private.remove_revoked_push_devices() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' or not new.active then delete from public.push_subscriptions where user_id=old.user_id; end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function private.remove_revoked_push_devices() from public,anon,authenticated,service_role;
create trigger remove_revoked_push_devices after update of active or delete on public.app_members
 for each row execute function private.remove_revoked_push_devices();

create function private.run_notification_delivery() returns void
 language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if not pg_try_advisory_xact_lock(58741982) then return; end if;
 perform private.flush_app_notifications();
 delete from public.notifications where created_at<now()-interval '90 days';
 if exists(select 1 from private.notification_deliveries where attempts<5 and available_at<=now() and (lease_until is null or lease_until<now())) then
  select decrypted_secret into token from vault.decrypted_secrets where name='union_push_job_token';
  perform net.http_post(url:='https://kgfqvyiawuzlkyfbnjqv.supabase.co/functions/v1/union-notifications',
   headers:=jsonb_build_object('Content-Type','application/json','x-job-token',token),body:='{"action":"deliver"}'::jsonb,timeout_milliseconds:=10000);
 end if;
end $$;
revoke all on function private.run_notification_delivery() from public,anon,authenticated,service_role;
select cron.schedule('union-notifications','* * * * *','select private.run_notification_delivery()');
