import type { AuthorStamp } from './types'
import { AFFILIATION_FIELDS } from './affiliation'

export function creationAuthor(record: AuthorStamp & {creada_por?: string | null}) {
  if (record.created_by_name) return `Creado por ${record.created_by_name}`
  if (record.creada_por) return `Autoría anterior: ${record.creada_por}`
  return 'Autoría anterior no registrada'
}
export const fieldLabels: Record<string,string> = {
  ...Object.fromEntries(AFFILIATION_FIELDS.map(([key,label])=>[key,label])),
  nombre_completo:'Nombre completo', seccion:'Sección', titulo:'Título', descripcion:'Descripción',
  contestacion:'Contestación', estado:'Estado', gestion:'Gestión', estado_afiliacion:'Afiliación',
  motivo_baja:'Motivo de baja', ausencia_detectada_en:'Ausencia del listado', telefono:'Teléfono anterior',
  nuevo_estado:'Cambio de estado', cambio:'Cambio de estado', imagen_url:'Imagen',
}
