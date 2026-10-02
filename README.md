# CCOO Frigolouro — aplicación sindical privada

Aplicación Next.js con Supabase Auth. Cada persona debe iniciar sesión y tener
una entrada activa en `public.app_members`. El nombre visible procede de esta
tabla, administrada fuera del cliente. No hay registro público en la aplicación.

## Interfaz móvil

- Navegación inferior con Inicio, Orden del día, Métodos, Salud y Afiliación;
  las pantallas de creación e informes mantienen señalada su área.
- Inicio con las cuatro áreas y accesos directos para registrar incidencias
  y solicitudes. En ordenador, navegación superior y listas en dos columnas.
- Búsqueda, filtros y botones de creación/PDF visibles. Las tarjetas muestran
  el estado y permiten desplegar descripción, contestación e historial.
- Edición con botones explícitos y teclado (Enter para guardar un título,
  Escape para cancelar). Los formularios móviles usan una columna y controles
  de 16px; las fichas de afiliación agrupan sus 16 campos sin eliminarlos.
- El diseño respeta movimiento reducido, área segura inferior y foco visible.
  No modifica el esquema, RLS, las membresías ni los datos existentes.

La revisión visual e interactiva se hace con registros ficticios en un entorno
local separado de la aplicación publicada, sin introducir datos de prueba en
Supabase. La compilación de producción comprueba TypeScript; la protección de
las rutas se comprueba también mediante peticiones sin sesión.

## Autoría automática y actividad

Las altas y modificaciones se atribuyen a la cuenta autenticada y al nombre
autorizado de `app_members`. Los formularios no solicitan el nombre de quien
registra. Supabase fija creador, última persona que modifica y fecha mediante
triggers; rechaza la suplantación aunque el cliente envíe otro nombre o UUID.
Esto incluye incidencias, métodos, salud, afiliación, gestiones, historiales
e importaciones del Excel.

Las fichas muestran la creación y el último cambio, y el desplegable «Quién
hizo cada cambio» permite consultar actividad paginada. `registro_actividad`
guarda actor, fecha, operación y nombres de los campos, sin duplicar su
contenido. Solo miembros activos pueden leerla; el cliente no puede insertar,
editar ni borrar este registro. Las funciones de trigger están en el esquema
privado y las escrituras originales siguen sujetas a RLS.

La migración aplicada se documenta en `database/automatic-authorship.sql`.
No volver a ejecutarla. No se atribuyen retroactivamente cambios antiguos:
conservan su autoría anterior, diferenciada de la autoría verificada.
`database/test-automatic-authorship.sql` comprueba las nueve tablas, rechazo
de suplantación, preservación del creador y permisos; revierte sus escrituras.
Las pruebas de sincronización comprueban también la autoría en el RPC.

## Identidad visual e informes

La aplicación utiliza el logo oficial transparente de CCOO Frigolouro,
sin modificarlo, y los colores rojo, negro, blanco y el acento cian del logo.
Se conservan la navegación móvil y todas las opciones de gestión.

Los cuatro informes y la ficha individual comparten `lib/pdf-report.ts`:
cabecera oficial, fecha completa, títulos negros, texto justificado,
tablas rojas y pie de documento interno con número de página. El diseño
se ha contrastado con las plantillas internas del proyecto. Los informes
mantienen los filtros y la autoría verificada cuando existe. La carga del logo
es obligatoria antes de exportar.

Incidencias, métodos y salud utilizan maquetación compacta, conservando todos
sus datos, contestaciones e historiales. Agrupan los registros por sección,
con encabezado y total de cada grupo, siguiendo el orden de secciones de la
aplicación y, dentro de cada sección, la fecha de creación de antigua a reciente.
Las secciones adicionales se sitúan al final por orden alfabético.
Si el informe de afiliación contiene
más de una persona, exporta una tabla breve con nombre y apellidos, sección y
teléfono (móvil, fijo o teléfono anterior, por ese orden), con cabecera repetida
en cada página. Antes del listado, el resumen por sección utiliza una tabla
con la sección y el número de personas. Un único resultado y la ficha individual
conservan el formato completo, todos los campos y las gestiones.

## Ejecutar en local

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
