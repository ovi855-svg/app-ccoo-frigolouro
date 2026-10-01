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

## Afiliación

`database/affiliation-fields.sql` documenta la migración aplicada
`affiliation_fields_and_safe_sync`. No volver a ejecutarla sobre el mismo proyecto.
La ficha incluye las 16 columnas del listado de afiliación, sección, historial
de gestiones y estado de afiliación separado del estado de pago. `AC` significa
al corriente. Las secciones de altas nuevas quedan como `Sin asignar`.

- Se admiten XLSX, XLSM y CSV con las 16 columnas originales. La lectura de
  XLSM no ejecuta macros. El archivo se procesa en el navegador.
- La vista previa muestra altas, actualizaciones, reactivaciones y bajas.
  Es necesario resolver coincidencias dudosas y confirmar que es un listado
  completo. Las celdas vacías sustituyen los valores anteriores de esos campos.
- La sincronización es una única transacción con permisos de la persona que
  la solicita (`SECURITY INVOKER`), autorización de membresía y RLS. Una vista
  previa deja de ser válida si la base de datos ha cambiado.
- DNI/NIE se compara sin puntuación, normalizando ceros iniciales y letra de
  control ausente. Se conserva la letra conocida si el documento coincide.
  Esto no verifica la validez administrativa del documento. El índice único
  evita duplicar fichas con el mismo documento.
- Solo se usa el nombre completo normalizado si la coincidencia es única.
  Un documento distinto requiere resolver la coincidencia explícitamente.
- Las personas ausentes pasan a bajas conservando UUID, sección, datos y
  gestiones. La reaparición reactiva la misma ficha. Se registra la detección
  de la ausencia, sin inferir una fecha efectiva de baja.
- El cliente no tiene permiso de borrado permanente de fichas. Permite
  archivar, reactivar, añadir y editar personas. Los informes separan
  afiliación activa y bajas.

Validación del lector: `node scripts/test-affiliation.mjs`. Opcionalmente recibe
una ruta local al Excel y otra a una extracción independiente privada.
`database/test-affiliation-sync.sql` contiene pruebas con datos ficticios,
incluyendo archivado, reactivación, concurrencia y acceso; siempre revierte
la transacción. No sustituir sus datos ficticios por registros personales.
