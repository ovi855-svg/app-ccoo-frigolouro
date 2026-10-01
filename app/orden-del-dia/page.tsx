import {requireMember} from '@/lib/require-member'
import IncidenciasManager from '@/components/IncidenciasManager'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function OrdenDiaPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Orden del día" description="Incidencias y temas para las reuniones." icon="agenda"/><IncidenciasManager/></main>
}
