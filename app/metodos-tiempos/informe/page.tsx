import {requireMember} from '@/lib/require-member'
import MetodosInformeGenerator from '@/components/MetodosInformeGenerator'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function InformeMetodosPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Informe de métodos y tiempos" description="Elige las solicitudes que quieres incluir en el PDF." icon="clock" back={{href: "/metodos-tiempos", label: "Volver al listado"}}/><MetodosInformeGenerator/></main>
}
