import {requireMember} from '@/lib/require-member'
import MetodosManager from '@/components/MetodosManager'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function MetodosPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Métodos y tiempos" description="Solicitudes de revisión y seguimiento de ritmos." icon="clock"/><MetodosManager/></main>
}
