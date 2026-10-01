import {requireMember} from '@/lib/require-member'
import InformeGenerator from '@/components/InformeGenerator'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function InformePage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Informe del orden del día" description="Elige los registros que quieres incluir en el PDF." icon="agenda" back={{href: "/orden-del-dia", label: "Volver al listado"}}/><InformeGenerator/></main>
}
