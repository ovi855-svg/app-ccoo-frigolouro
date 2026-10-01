-- All writes use fictional records and are rolled back, including activity.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.app_members where active limit 1),true);
set local role authenticated;
do $$
declare item public.incidencias; method public.metodos_items; health public.salud_laboral; person public.afiliados; gestion public.gestiones_afiliados; imported public.importaciones_afiliacion; legacy public.incidencias; member_name text; stamp uuid:=auth.uid(); failed boolean; log_count integer;
begin
  select display_name into member_name from public.app_members where user_id=stamp;
  insert into public.incidencias(titulo,seccion,estado,creada_por,created_by,created_by_name)
    values('PRUEBA FICTICIA AUTORIA','General','Nuevo','NOMBRE FALSO','00000000-0000-0000-0000-000000000000','NOMBRE FALSO') returning * into item;
  if item.created_by<>stamp or item.created_by_name<>member_name or item.creada_por<>member_name then raise exception 'Spoofed creation author'; end if;
  update public.incidencias set descripcion='EDICION FICTICIA',created_by_name='NOMBRE FALSO',updated_by_name='NOMBRE FALSO',creada_por='NOMBRE FALSO' where id=item.id returning * into item;
  if item.created_by<>stamp or item.created_by_name<>member_name or item.creada_por<>member_name or item.updated_by_name<>member_name then raise exception 'Spoofed update author'; end if;
  insert into public.historial_cambios(incidencia_id,nuevo_estado) values(item.id,'Pendiente');
  if not exists(select 1 from public.historial_cambios where incidencia_id=item.id and created_by=stamp and created_by_name=member_name) then raise exception 'History author missing'; end if;
  insert into public.afiliados(nombre,apellidos,seccion) values('PERSONA FICTICIA','PRUEBA AUTORIA','Sin asignar') returning * into person;
  insert into public.gestiones_afiliados(afiliado_id,gestion) values(person.id,'GESTION FICTICIA') returning * into gestion;
  update public.gestiones_afiliados set gestion='GESTION FICTICIA EDITADA' where id=gestion.id;
  delete from public.gestiones_afiliados where id=gestion.id;
  if not exists(select 1 from public.registro_actividad where resource_id=person.id::text and table_name='gestiones_afiliados' and operation='DELETE' and actor_id=stamp and actor_name=member_name) then raise exception 'Deleted management author missing'; end if;
  if not exists(select 1 from public.registro_actividad where resource_id=item.id::text and operation='UPDATE' and changed_fields=array['descripcion']) then raise exception 'Wrong changed fields'; end if;
  select count(*) into log_count from public.registro_actividad where resource_id in (person.id::text,item.id::text);
  if log_count<>7 then raise exception 'Wrong activity count: %',log_count; end if;
  insert into public.metodos_items(titulo,seccion,creada_por) values('REVISION FICTICIA','General','FALSO') returning * into method;
  update public.metodos_items set descripcion='REVISION EDITADA',updated_by_name='FALSO' where id=method.id returning * into method;
  insert into public.metodos_historial(item_id,nuevo_estado) values(method.id,'Solicitada');
  if method.creada_por<>member_name or method.created_by<>stamp or method.updated_by_name<>member_name or not exists(select 1 from public.metodos_historial where item_id=method.id and created_by=stamp) then raise exception 'Methods authorship missing'; end if;
  insert into public.salud_laboral(titulo,descripcion,seccion,estado,creada_por) values('SALUD FICTICIA','DESCRIPCION FICTICIA','General','Nuevo','FALSO') returning * into health;
  update public.salud_laboral set contestacion='RESPUESTA FICTICIA',updated_by_name='FALSO' where id=health.id returning * into health;
  insert into public.historial_salud(salud_id,cambio) values(health.id,'Pendiente');
  if health.creada_por<>member_name or health.created_by<>stamp or health.updated_by_name<>member_name or not exists(select 1 from public.historial_salud where salud_id=health.id and created_by=stamp) then raise exception 'Health authorship missing'; end if;
  insert into public.importaciones_afiliacion(user_id,total,altas,actualizadas,reactivadas,bajas) values('00000000-0000-0000-0000-000000000000',0,0,0,0,0) returning * into imported;
  if imported.user_id<>stamp or imported.created_by<>stamp or imported.created_by_name<>member_name then raise exception 'Import actor forged'; end if;
  select * into legacy from public.incidencias where created_by is null order by id limit 1;
  if legacy.id is not null then
    update public.incidencias set created_by=stamp,created_by_name='FALSO',creada_por='FALSO' where id=legacy.id returning * into item;
    if item.created_by is distinct from legacy.created_by or item.created_by_name is distinct from legacy.created_by_name or item.creada_por is distinct from legacy.creada_por or item.updated_by<>stamp then raise exception 'Historical author overwritten'; end if;
  end if;
  failed:=false;
  begin insert into public.registro_actividad(actor_name,table_name,record_id,resource_table,resource_id,operation) values('FALSO','afiliados','0','afiliados','0','INSERT'); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Client can forge activity'; end if;
  failed:=false;
  begin update public.registro_actividad set actor_name='FALSO'; exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Client can edit activity'; end if;
  failed:=false;
  begin delete from public.registro_actividad; exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Client can delete activity'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);
set local role authenticated;
do $$
declare failed boolean:=false;
begin
  if exists(select 1 from public.registro_actividad) then raise exception 'Nonmember reads activity'; end if;
  begin insert into public.incidencias(titulo,seccion) values('PRUEBA SIN ACCESO','General'); exception when insufficient_privilege then failed:=true; end;
  if not failed then raise exception 'Nonmember can write'; end if;
end $$;
reset role;
rollback;
