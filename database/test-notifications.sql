-- Functional notification/security tests. No messages are sent; all writes roll back.
begin;
create temporary table qa_notice_users as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() c;
grant select on qa_notice_users to authenticated;
insert into auth.users(id,aud,role) select a,'authenticated','authenticated' from qa_notice_users union all select b,'authenticated','authenticated' from qa_notice_users union all select c,'authenticated','authenticated' from qa_notice_users;
insert into public.app_members(user_id,display_name,active)
 select a,'QA Cuenta A',true from qa_notice_users union all select b,'QA Cuenta B',true from qa_notice_users union all select c,'QA Inactiva',false from qa_notice_users;
insert into public.push_subscriptions(user_id,endpoint,p256dh,auth)
 select b,'https://fcm.googleapis.com/fcm/send/qa-fictional-device','B'||repeat('a',86),repeat('b',22) from qa_notice_users;
select set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true) from qa_notice_users;
select set_config('request.jwt.claim.sub',a::text,true) from qa_notice_users;
set local role authenticated;
-- A real parent update exercises verified authorship, activity and queue triggers.
update public.incidencias set descripcion='QA CAMBIO FICTICIO REVERTIDO' where id=(select min(id) from public.incidencias);
do $$
declare failed boolean;
begin
 if exists(select 1 from public.push_subscriptions) then raise exception 'Another member reads device keys'; end if;
 failed:=false;
 begin insert into public.push_subscriptions(user_id,endpoint,p256dh,auth)
  select b,'https://fcm.googleapis.com/fcm/send/qa-forged','B'||repeat('a',86),repeat('b',22) from qa_notice_users;
 exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Subscription owner can be forged'; end if;
 failed:=false;
 begin insert into public.push_subscriptions(user_id,endpoint,p256dh,auth)
  select a,'https://127.0.0.1/internal','B'||repeat('a',86),repeat('b',22) from qa_notice_users;
 exception when check_violation then failed:=true; end;
 if not failed then raise exception 'SSRF endpoint accepted'; end if;
 failed:=false;
 begin perform public.notification_worker_config(); exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Member can read worker secrets'; end if;
 failed:=false;
 begin perform public.claim_notification_deliveries(); exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Member can claim push jobs'; end if;
 failed:=false;
 begin insert into public.notifications(recipient_id,actor_name,category,message,href)
  select a,'FORGED','incidencias','FORGED','/' from qa_notice_users;
 exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Member can forge notifications'; end if;
end $$;
reset role;
select private.flush_app_notifications();
do $$
declare a_id uuid; b_id uuid; c_id uuid;
begin
 select a,b,c into a_id,b_id,c_id from qa_notice_users;
 if exists(select 1 from public.notifications where actor_id=a_id and recipient_id=a_id) then raise exception 'Actor receives own changes'; end if;
 if not exists(select 1 from public.notifications where actor_id=a_id and recipient_id=b_id and category='incidencias') then raise exception 'Other member missing alert'; end if;
 if exists(select 1 from public.notifications where actor_id=a_id and recipient_id=c_id) then raise exception 'Inactive member receives alert'; end if;
 if (select count(*) from private.notification_deliveries d join public.notifications n on n.id=d.notification_id where n.actor_id=a_id)<>1 then raise exception 'Initial push missing or duplicated'; end if;
end $$;
-- No-op writes and companion history entries do not create additional alerts.
insert into public.registro_actividad(actor_id,actor_name,table_name,record_id,resource_table,resource_id,operation,changed_fields)
 select a,'QA Cuenta A','incidencias','qa-no-op','incidencias','qa-no-op','UPDATE','{}' from qa_notice_users;
insert into public.registro_actividad(actor_id,actor_name,table_name,record_id,resource_table,resource_id,operation,changed_fields)
 select a,'QA Cuenta A','historial_cambios','qa-history','incidencias','qa-no-op','INSERT','{nuevo_estado}' from qa_notice_users;
do $$ begin if exists(select 1 from private.notification_events where resource_id='qa-no-op') then raise exception 'No-op or history created duplicate alert'; end if; end $$;
-- An import with many affiliation writes produces just one notification per recipient.
insert into public.registro_actividad(actor_id,actor_name,table_name,record_id,resource_table,resource_id,operation,changed_fields)
 select a,'QA Cuenta A','afiliados','qa-person-'||i,'afiliados','qa-person-'||i,'UPDATE','{nombre}'
 from qa_notice_users cross join generate_series(1,30) i;
insert into public.registro_actividad(actor_id,actor_name,table_name,record_id,resource_table,resource_id,operation,changed_fields)
 select a,'QA Cuenta A','importaciones_afiliacion','qa-import','importaciones_afiliacion','qa-import','INSERT','{total}' from qa_notice_users;
select private.flush_app_notifications();
do $$ declare b_id uuid; begin
 select b into b_id from qa_notice_users;
 if (select count(*) from public.notifications where recipient_id=b_id and category='afiliacion')<>1 then raise exception 'Import not grouped'; end if;
 if exists(select 1 from public.notifications where recipient_id=b_id and category='afiliacion' and href<>'/afiliados') then raise exception 'Import targets arbitrary record'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true) from qa_notice_users;
select set_config('request.jwt.claim.sub',b::text,true) from qa_notice_users;
set local role authenticated;
do $$ declare failed boolean; affected integer; begin
 if (select count(*) from public.notifications)<>2 then raise exception 'Recipient inbox wrong'; end if;
 update public.notifications set read_at=now() where recipient_id=(select a from qa_notice_users);
 get diagnostics affected=row_count;if affected<>0 then raise exception 'Can mark another inbox read'; end if;
 failed:=false;
 begin update public.notifications set actor_name='FORGED'; exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Notification contents editable'; end if;
 insert into public.notification_preferences(user_id,salud) select b,false from qa_notice_users;
end $$;
reset role;
insert into public.registro_actividad(actor_id,actor_name,table_name,record_id,resource_table,resource_id,operation,changed_fields)
 select a,'QA Cuenta A','salud_laboral','qa-health','salud_laboral','qa-health','INSERT','{descripcion}' from qa_notice_users;
select private.flush_app_notifications();
do $$ begin
 if exists(select 1 from private.notification_deliveries d join public.notifications n on n.id=d.notification_id where n.category='salud' and n.recipient_id=(select b from qa_notice_users)) then raise exception 'Muted category still pushes'; end if;
 if not exists(select 1 from public.notifications where category='salud' and recipient_id=(select b from qa_notice_users)) then raise exception 'Category preference removed inbox activity'; end if;
end $$;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$ declare jobs jsonb; job_id uuid; begin
 jobs:=public.claim_notification_deliveries();
 if jsonb_array_length(jobs)<>2 then raise exception 'Wrong jobs claimed'; end if;
 if jsonb_array_length(public.claim_notification_deliveries())<>0 then raise exception 'Leased jobs claimed twice'; end if;
 job_id:=(jobs->0->>'id')::uuid;
 perform public.finish_notification_delivery(job_id,503);
 if not exists(select 1 from private.notification_deliveries where notification_deliveries.id=job_id and lease_until is null and available_at>now() and attempts=1) then raise exception 'Retry not scheduled'; end if;
 perform public.finish_notification_delivery(job_id,201);
 if exists(select 1 from private.notification_deliveries where notification_deliveries.id=job_id) then raise exception 'Successful delivery not removed'; end if;
 perform public.finish_notification_delivery((jobs->1->>'id')::uuid,410);
 if exists(select 1 from public.push_subscriptions where user_id=(select b from qa_notice_users)) then raise exception 'Expired device not removed'; end if;
end $$;
insert into public.push_subscriptions(user_id,endpoint,p256dh,auth)
 select b,'https://fcm.googleapis.com/fcm/send/qa-revocation','B'||repeat('a',86),repeat('b',22) from qa_notice_users;
update public.app_members set active=false where user_id=(select b from qa_notice_users);
do $$ begin if exists(select 1 from public.push_subscriptions where user_id=(select b from qa_notice_users)) then raise exception 'Revoked member retains device'; end if; end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true) from qa_notice_users;
select set_config('request.jwt.claim.sub',c::text,true) from qa_notice_users;
set local role authenticated;
do $$ begin if exists(select 1 from public.notifications) then raise exception 'Inactive account reads inbox'; end if; end $$;
reset role;
rollback;
select 'Notification triggers, self exclusion, recipients, imports, RLS, SSRF, categories, leases, retries and revocation passed; all writes rolled back.' as result;
