import {requireMember} from '@/lib/require-member'
import AfiliadosManager from '@/components/AfiliadosManager'
import PageHeader from '@/components/PageHeader'
export const dynamic = 'force-dynamic'
export default async function AfiliadosPage() {
 await requireMember()
 return <main id="main-content" className="page-container"><PageHeader title="Afiliación" description="Fichas, contactos y seguimiento de gestiones." icon="people"/><AfiliadosManager/></main>
}
