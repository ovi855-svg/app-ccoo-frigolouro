import { Suspense } from 'react'
import AfiliadosManager from '@/components/AfiliadosManager'



export const dynamic = 'force-dynamic'

export default function AfiliadosPage() {
    return (
        <main style={{
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}>
            <h1 style={{
                textAlign: 'center',
                color: '#dc2626', // Rojo CCOO
                marginBottom: '30px',
                fontSize: '2.5rem',
                borderBottom: '3px solid #dc2626',
                paddingBottom: '15px'
            }}>
                Gestión de Afiliados
            </h1>

            <div style={{ marginTop: '30px' }}>
                <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Cargando sistema de afiliados...</div>}>
                    <AfiliadosManager />
                </Suspense>
            </div>
        </main>
    )
}
