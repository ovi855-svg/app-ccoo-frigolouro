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
                <Link href="/incidencias" style={{
                    textDecoration: 'none',
                    color: '#333',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s'
                }} className="hover:bg-gray-100">
                    Incidencias
                </Link>
                <Link href="/informe" style={{
                    textDecoration: 'none',
                    color: '#333',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s'
                }} className="hover:bg-gray-100">
                    Informe PDF
                </Link>
            </div>
        </nav>
    )
}
