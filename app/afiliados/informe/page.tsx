import AfiliadosInformeGenerator from '@/components/AfiliadosInformeGenerator'

export const dynamic = 'force-dynamic'

export default function InformeAfiliadosPage() {
    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Navbar global */}
            <div className="page-container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
                <div style={{ marginBottom: '30px' }}>
                    <a href="/afiliados" style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        ← Volver a Gestión de Afiliados
                    </a>
                </div>

                <AfiliadosInformeGenerator />
            </div>
        </main>
    )
}
