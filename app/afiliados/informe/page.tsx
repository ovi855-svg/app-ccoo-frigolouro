import {requireMember} from '@/lib/require-member'
import AfiliadosInformeGenerator from '@/components/AfiliadosInformeGenerator'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function InformeAfiliadosPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Informe de afiliación" description="Prepara un PDF con las fichas y las gestiones." icon="people" back={{href: "/afiliados", label: "Volver al listado"}}/><AfiliadosInformeGenerator/></main>
}
