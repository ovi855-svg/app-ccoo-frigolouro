import SaludInformeGenerator from '@/components/SaludInformeGenerator'

export default function InformeSaludPage() {
    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Navbar global */}
            <div className="page-container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
                <div style={{ marginBottom: '30px' }}>
                    <a href="/salud-laboral" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        ← Volver a Salud Laboral
                    </a>
                </div>

                <SaludInformeGenerator />
            </div>
        </main>
    )
}
