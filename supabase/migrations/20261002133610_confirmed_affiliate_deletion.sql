-- No bulk/direct table DELETE grant: this narrow operation deletes one confirmed,
-- unchanged record. Existing cascade removes its gestiones; audit triggers remain.
create function private.delete_confirmed_affiliate(p_id uuid,p_updated_at timestamptz,p_confirmado boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); revision timestamptz;
begin
  if actor is null then raise exception 'Es necesario iniciar sesión' using errcode='42501'; end if;
  perform 1 from public.app_members where user_id=actor and active for share;
  if not found then raise exception 'Cuenta sin acceso autorizado' using errcode='42501'; end if;
  if p_confirmado is distinct from true then raise exception 'Es necesario confirmar el borrado' using errcode='22023'; end if;
  select updated_at into revision from public.afiliados where id=p_id for update;
  if not found then raise exception 'La ficha ya no está disponible. Recarga el listado.' using errcode='P0002'; end if;
  if revision is distinct from p_updated_at then
    raise exception 'La ficha ha cambiado. Recarga el listado y revisa los datos antes de borrarla.' using errcode='40001';
  end if;
  delete from public.afiliados where id=p_id;
  return p_id;
end $$;
revoke all on function private.delete_confirmed_affiliate(uuid,timestamptz,boolean) from public,anon,authenticated,service_role;
grant execute on function private.delete_confirmed_affiliate(uuid,timestamptz,boolean) to authenticated;

-- Preparsed SQL binds the private function without granting schema USAGE.
-- The exposed entrypoint keeps invoker privileges; all checks live privately.
create function public.borrar_afiliado(p_id uuid,p_updated_at timestamptz,p_confirmado boolean)
returns uuid language sql security invoker set search_path=''
begin atomic
  select private.delete_confirmed_affiliate(p_id,p_updated_at,p_confirmado);
end;
revoke all on function public.borrar_afiliado(uuid,timestamptz,boolean) from public,anon,authenticated,service_role;
grant execute on function public.borrar_afiliado(uuid,timestamptz,boolean) to authenticated;
notify pgrst,'reload schema';
