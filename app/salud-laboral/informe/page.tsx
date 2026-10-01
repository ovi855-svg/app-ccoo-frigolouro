import {requireMember} from '@/lib/require-member'
import SaludInformeGenerator from '@/components/SaludInformeGenerator'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function InformeSaludPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Informe de salud laboral" description="Elige las incidencias que quieres incluir en el PDF." icon="health" back={{href: "/salud-laboral", label: "Volver al listado"}}/><SaludInformeGenerator/></main>
}
