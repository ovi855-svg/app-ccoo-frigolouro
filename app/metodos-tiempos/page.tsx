import MetodosManager from '@/components/MetodosManager'

export const dynamic = 'force-dynamic'

export default function MetodosTiemposPage() {
    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <div className="page-container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '10px'
                }}>
                    Métodos y Tiempos
                </h1>
                <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.1rem' }}>
                    Gestión de Solicitudes
                </p>

                <div className="animate-fade-in">
                    <MetodosManager />
                </div>
            </div>
        </main>
    )
}
