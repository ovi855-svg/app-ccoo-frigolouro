import { requireMember } from '@/lib/require-member'
import InformeGenerator from '@/components/InformeGenerator'

export const dynamic = 'force-dynamic'

export default async function InformeOrdenDiaPage() {
    await requireMember()
    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="page-container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '10px'
                }}>
                    Orden del Día - Informe
                </h1>
                <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.1rem' }}>
                    Generar PDF de incidencias y tareas pendientes
                </p>

                <div className="animate-fade-in">
                    <InformeGenerator />
                </div>
            </div>
        </main>
    )
}
