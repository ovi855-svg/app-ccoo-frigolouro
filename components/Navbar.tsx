import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            marginBottom: '30px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Logo contenedor circular */}
                <div style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* @ts-ignore - Validación de tipos de Next.js Image a veces falla en build estricto */}
                    <Image
                        src="/logo.png"
                        alt="Logo CCOO"
                        width={80}
                        height={80}
                        style={{ width: 'auto', height: '100%' }}
                        priority
                    />
                </div>
                <div style={{
                    fontWeight: '800',
                    fontSize: '1.4rem',
                    color: 'var(--ccoo-red)',
                    letterSpacing: '-0.5px'
                }}>
                    CCOO Frigolouro
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
                <Link href="/orden-del-dia" style={{
                    textDecoration: 'none',
                    color: '#333',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca'
                }} className="hover:bg-red-50">
                    Orden del Día
                </Link>
            </div>
        </nav>
    )
}
