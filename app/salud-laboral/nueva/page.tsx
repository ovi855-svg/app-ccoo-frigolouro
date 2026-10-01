import { requireMember } from '@/lib/require-member'

import NuevaSaludForm from '@/components/NuevaSaludForm'

export const dynamic = 'force-dynamic'

export default async function NuevaSaludPage() {
    await requireMember()
    return (
        <main>
            <NuevaSaludForm />
        </main>
    )
}
