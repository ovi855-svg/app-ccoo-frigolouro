# CCOO Frigolouro — aplicación sindical privada

Aplicación Next.js con Supabase Auth. Cada persona debe iniciar sesión y tener
una entrada activa en `public.app_members`. El nombre visible procede de esta
tabla, administrada fuera del cliente. No hay registro público en la aplicación.

## Desarrollo

1. Ejecutar `npm ci`.
2. Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Se admite la variable existente
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` para mantener la compatibilidad del despliegue.
3. Ejecutar `npm run dev`; para validar producción, `npm run build`.

Nunca incluir claves secretas o `service_role`, exportaciones ni datos de
afiliación en este repositorio. Las variables públicas solo deben contener
la URL y una clave publicable o legacy anon.

## Acceso

- La pantalla de acceso es `/login`; permite entrar y solicitar recuperación.
- Las invitaciones y recuperaciones terminan en `/auth/password`.
- `/auth/callback` admite PKCE; `/auth/confirm` admite enlaces con token hash
  de invitación o recuperación. Los enlaces se validan con Supabase.
- Todas las páginas de gestión verifican identidad y membresía en el servidor.
  La base de datos aplica RLS y permisos también a las consultas directas.
- El menú muestra el nombre autorizado y permite cerrar sesión.

En Supabase, desactivar las altas públicas y los accesos anónimos. Configurar
Site URL como la URL de producción terminada en `/login` y permitir únicamente
las redirecciones de contraseña necesarias. Invitar a cada persona por correo
y, tras crear su identidad, añadir su UUID y nombre a `app_members` desde la
administración del proyecto. Una invitación por sí sola no concede acceso a
los datos. Para retirarlo, marcar `active = false`.

`database/private-access.sql` documenta la configuración aplicada a las tablas
existentes. No volver a ejecutarlo: crea la tabla de membresías y sustituye
las políticas. Las migraciones aplicadas se registran en Supabase.
