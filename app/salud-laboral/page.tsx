import {requireMember} from '@/lib/require-member'
import SaludManager from '@/components/SaludManager'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function SaludPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Salud laboral" description="Prevención y condiciones de trabajo." icon="health"/><SaludManager/></main>
}
