import Navbar from '@/components/Navbar'
import SaludManager from '@/components/SaludManager'

export default function SaludLaboralPage() {
    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Navbar />
            <div className="page-container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '10px'
                }}>
                    Salud Laboral
                </h1>
                <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '1.1rem' }}>
                    Gestión de incidencias y deficiencias en prevención
                </p>

                <SaludManager />
            </div>
        </main>
    )
}
