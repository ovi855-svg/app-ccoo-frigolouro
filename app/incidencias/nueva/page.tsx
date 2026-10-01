import { requireMember } from '@/lib/require-member'

import NuevaIncidenciaForm from '@/components/NuevaIncidenciaForm'

export const dynamic = 'force-dynamic'

export default async function NuevaIncidenciaPage() {
    await requireMember()
    return (
        <main id="main-content" className="page-container">
            <NuevaIncidenciaForm />
        </main>
    )
}
