-- Applied through Supabase MCP: affiliation_fields_and_safe_sync.
-- Schema and reusable routines only. Never commit actual affiliation records.
create function public.normalizar_documento(valor text) returns text
language plpgsql immutable security invoker set search_path = '' as $$
declare n text := regexp_replace(upper(coalesce(valor,'')), '[^A-Z0-9]', '', 'g');
begin
  if n ~ '^[0-9]{7,8}[A-Z]$' or n ~ '^[XYZ][0-9]{7}[A-Z]$' then n := left(n,length(n)-1); end if;
  if n ~ '^[0-9]{1,8}$' then n := lpad(n,8,'0'); end if;
  return nullif(n,'');
end $$;
create function public.normalizar_nombre(valor text) returns text
language sql immutable security invoker set search_path = '' as $$
  select string_agg(palabra,' ' order by palabra) from regexp_split_to_table(
    regexp_replace(translate(upper(coalesce(valor,'')), 'ÁÉÍÓÚÜÑ','AEIOUUN'),'[^A-Z0-9]+',' ','g'),' +'
  ) palabra where palabra <> '';
$$;
revoke all on function public.normalizar_documento(text),public.normalizar_nombre(text) from public,anon;
grant execute on function public.normalizar_documento(text),public.normalizar_nombre(text) to authenticated;

alter table public.afiliados
  add column nombre text,
  add column apellidos text,
  add column via text,
  add column numero text,
  add column piso text,
  add column fecha_nacimiento date,
  add column pais text,
  add column categoria text,
  add column estado_pago text,
  add column telefono_fijo text,
  add column telefono_movil text,
  add column correo_electronico text,
  add column estado_afiliacion text not null default 'activa' check (estado_afiliacion in ('activa','baja')),
  add column ausencia_detectada_en timestamptz,
  add column motivo_baja text,
  add column updated_at timestamptz not null default now(),
  add column dni_normalizado text generated always as (public.normalizar_documento(dni)) stored;
create unique index afiliados_documento_unico on public.afiliados(dni_normalizado) where dni_normalizado is not null;
revoke delete on public.afiliados from authenticated;

create function public.actualizar_ficha_afiliacion() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.dni := nullif(regexp_replace(upper(coalesce(new.dni,'')), '[^A-Z0-9]', '', 'g'),'');
  if nullif(btrim(new.nombre),'') is not null and nullif(btrim(new.apellidos),'') is not null then
    new.nombre_completo := btrim(new.apellidos) || ', ' || btrim(new.nombre);
  end if;
  if nullif(btrim(new.nombre_completo),'') is null then raise exception 'El nombre es obligatorio'; end if;
  if new.nombre is not null or new.apellidos is not null then
    if nullif(btrim(new.nombre),'') is null or nullif(btrim(new.apellidos),'') is null then
      raise exception 'Completa nombre y apellidos';
    end if;
  end if;
  if tg_op = 'INSERT' or new.telefono_movil is distinct from old.telefono_movil or new.telefono_fijo is distinct from old.telefono_fijo then
    new.telefono := coalesce(nullif(new.telefono_movil,''),nullif(new.telefono_fijo,''),new.telefono);
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
revoke all on function public.actualizar_ficha_afiliacion() from public,anon,authenticated;
create trigger actualizar_ficha_afiliacion before insert or update on public.afiliados
for each row execute function public.actualizar_ficha_afiliacion();

create table public.importaciones_afiliacion (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 user_id uuid not null references auth.users(id),
 total integer not null, altas integer not null, actualizadas integer not null, reactivadas integer not null, bajas integer not null
);
alter table public.importaciones_afiliacion enable row level security;
create policy miembros_lectura on public.importaciones_afiliacion for select to authenticated
using (exists (select 1 from public.app_members where user_id=(select auth.uid()) and active));
create policy miembros_insercion on public.importaciones_afiliacion for insert to authenticated
with check (user_id=(select auth.uid()) and exists (select 1 from public.app_members where user_id=(select auth.uid()) and active));
revoke all on public.importaciones_afiliacion from anon,authenticated;
grant select,insert on public.importaciones_afiliacion to authenticated;

create function public.sincronizar_afiliacion(p_filas jsonb,p_aplicar boolean default false,p_resoluciones jsonb default '{}'::jsonb,p_revision text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 fila jsonb; plan jsonb := '[]'; conflictos jsonb := '[]'; entradas jsonb := '[]'; ausentes jsonb;
 ids uuid[] := '{}'; identificadores text[] := '{}'; candidato public.afiliados%rowtype;
 candidatos integer; coincidencias integer; documento text; nombre_clave text; resolucion text;
 revision text; altas integer:=0; actualizadas integer:=0; reactivadas integer:=0; bajas integer:=0;
 total integer; result jsonb; requisitos text[] := array['dni','nombre','apellidos','via','direccion','numero','piso','codigo_postal','localidad','fecha_nacimiento','pais','categoria','estado_pago','telefono_fijo','telefono_movil','correo_electronico'];
begin
 if not exists(select 1 from public.app_members where user_id=auth.uid() and active) then
   raise exception 'Acceso no autorizado' using errcode='42501';
 end if;
 if jsonb_typeof(p_filas) is distinct from 'array' or jsonb_array_length(p_filas) not between 1 and 10000 then
   raise exception 'El listado completo debe tener entre 1 y 10000 filas';
 end if;
 if jsonb_typeof(p_resoluciones) is distinct from 'object' then raise exception 'Resoluciones inválidas'; end if;
 total:=jsonb_array_length(p_filas);
 -- Serialize previews/imports against writes; applying requires the same database revision.
 lock table public.afiliados in share row exclusive mode;
 select md5(coalesce(string_agg(to_jsonb(a)::text,'|' order by a.id),'')) into revision from public.afiliados a;
 if p_aplicar and p_revision is distinct from revision then raise exception 'La afiliación ha cambiado. Revisa de nuevo la vista previa'; end if;
 for fila in select value from jsonb_array_elements(p_filas) loop
   if jsonb_typeof(fila) <> 'object' or not fila ?& requisitos then raise exception 'Faltan columnas del listado completo'; end if;
   if exists(select 1 from jsonb_each(fila) where jsonb_typeof(value) not in ('string','null')) then raise exception 'Tipo de dato incorrecto'; end if;
   documento:=public.normalizar_documento(fila->>'dni');
   if documento is null or nullif(btrim(fila->>'nombre'),'') is null or nullif(btrim(fila->>'apellidos'),'') is null then
     raise exception 'Hay una fila sin documento, nombre o apellidos';
   end if;
   if documento=any(identificadores) then raise exception 'Hay documentos repetidos en el archivo'; end if;
   identificadores:=array_append(identificadores,documento);
   if nullif(fila->>'fecha_nacimiento','') is not null then
     if (fila->>'fecha_nacimiento') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Fecha de nacimiento inválida'; end if;
     perform (fila->>'fecha_nacimiento')::date;
   end if;
   fila:=fila || jsonb_build_object('nombre_completo',btrim(fila->>'apellidos')||', '||btrim(fila->>'nombre'));
   nombre_clave:=public.normalizar_nombre(fila->>'nombre_completo');
   candidato:=null;
   select * into candidato from public.afiliados where dni_normalizado=documento;
   if candidato.id is null then
     select count(*) into candidatos from public.afiliados where public.normalizar_nombre(nombre_completo)=nombre_clave;
     select count(*) into coincidencias from jsonb_array_elements(p_filas) x
       where public.normalizar_nombre((x->>'apellidos')||', '||(x->>'nombre'))=nombre_clave;
     if candidatos=1 and coincidencias=1 then
       select * into candidato from public.afiliados where public.normalizar_nombre(nombre_completo)=nombre_clave;
       if candidato.dni_normalizado is not null then
         resolucion:=p_resoluciones->>documento;
         if resolucion=candidato.id::text then null;
         elsif resolucion='nueva' then candidato:=null;
         else
           conflictos:=conflictos || jsonb_build_array(jsonb_build_object('documento',documento,'nombre',fila->>'nombre_completo','candidato_id',candidato.id,'documento_anterior',candidato.dni,'seccion',candidato.seccion));
           candidato:=null;
         end if;
       end if;
     elsif candidatos>0 then
       if p_resoluciones->>documento is distinct from 'nueva' then
         conflictos:=conflictos || jsonb_build_array(jsonb_build_object('documento',documento,'nombre',fila->>'nombre_completo','ambiguo',true));
       end if;
     end if;
   end if;
   if candidato.id is not null then
     if candidato.id=any(ids) then raise exception 'Dos filas corresponden a la misma ficha'; end if;
     ids:=array_append(ids,candidato.id);
     actualizadas:=actualizadas+1;
     if candidato.estado_afiliacion='baja' then reactivadas:=reactivadas+1; end if;
   else altas:=altas+1; end if;
   plan:=plan || jsonb_build_array(jsonb_build_object('id',candidato.id,'fila',fila));
   entradas:=entradas || jsonb_build_array(jsonb_build_object('id',candidato.id,'documento',documento,'nombre',fila->>'nombre_completo','accion',case when candidato.id is null then 'alta' when candidato.estado_afiliacion='baja' then 'reactivacion' else 'actualizacion' end));
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre_completo,'seccion',seccion)),'[]') into ausentes
   from public.afiliados where estado_afiliacion='activa' and not (id=any(ids));
 bajas:=jsonb_array_length(ausentes);
 result:=jsonb_build_object('total',total,'altas',altas,'actualizadas',actualizadas,'reactivadas',reactivadas,'bajas',bajas,'conflictos',conflictos,'entradas',entradas,'ausentes',ausentes,'revision',revision);
 if not p_aplicar then return result; end if;
 if jsonb_array_length(conflictos)>0 then raise exception 'Resuelve las coincidencias pendientes antes de importar'; end if;
 for fila in select value from jsonb_array_elements(plan) loop
   candidato:=jsonb_populate_record(null::public.afiliados,fila->'fila');
   if fila->>'id' is null then
     insert into public.afiliados(nombre_completo,seccion,dni,nombre,apellidos,via,direccion,numero,piso,codigo_postal,localidad,fecha_nacimiento,pais,categoria,estado_pago,telefono_fijo,telefono_movil,correo_electronico)
     values(candidato.nombre_completo,'Sin asignar',candidato.dni,candidato.nombre,candidato.apellidos,candidato.via,candidato.direccion,candidato.numero,candidato.piso,candidato.codigo_postal,candidato.localidad,candidato.fecha_nacimiento,candidato.pais,candidato.categoria,candidato.estado_pago,candidato.telefono_fijo,candidato.telefono_movil,candidato.correo_electronico);
   else
     update public.afiliados a set nombre=candidato.nombre,apellidos=candidato.apellidos,
       dni=case when a.dni_normalizado=public.normalizar_documento(candidato.dni) and length(a.dni)>length(candidato.dni) then a.dni else candidato.dni end,
       via=candidato.via,direccion=candidato.direccion,numero=candidato.numero,piso=candidato.piso,codigo_postal=candidato.codigo_postal,localidad=candidato.localidad,fecha_nacimiento=candidato.fecha_nacimiento,pais=candidato.pais,categoria=candidato.categoria,estado_pago=candidato.estado_pago,telefono_fijo=candidato.telefono_fijo,telefono_movil=candidato.telefono_movil,correo_electronico=candidato.correo_electronico,telefono=coalesce(candidato.telefono_movil,candidato.telefono_fijo),estado_afiliacion='activa',motivo_baja=null
       where a.id=(fila->>'id')::uuid;
   end if;
 end loop;
 update public.afiliados set estado_afiliacion='baja',ausencia_detectada_en=now(),motivo_baja='Ausente del listado completo'
   where estado_afiliacion='activa' and dni_normalizado <> all(identificadores) and not(id=any(ids));
 -- Include old records without a document as well.
 update public.afiliados set estado_afiliacion='baja',ausencia_detectada_en=now(),motivo_baja='Ausente del listado completo'
   where estado_afiliacion='activa' and dni_normalizado is null and not(id=any(ids));
 insert into public.importaciones_afiliacion(user_id,total,altas,actualizadas,reactivadas,bajas)
 values(auth.uid(),total,altas,actualizadas,reactivadas,bajas);
 return result - 'entradas' - 'ausentes' - 'conflictos';
end $$;
revoke all on function public.sincronizar_afiliacion(jsonb,boolean,jsonb,text) from public,anon;
grant execute on function public.sincronizar_afiliacion(jsonb,boolean,jsonb,text) to authenticated;
