import { requireMember } from '@/lib/require-member'

import NuevaMetodosForm from '@/components/NuevaMetodosForm'

export const dynamic = 'force-dynamic'

export default async function NuevaMetodosPage() {
    await requireMember()
    return (
        <main>
            <NuevaMetodosForm />
        </main>
    )
}
