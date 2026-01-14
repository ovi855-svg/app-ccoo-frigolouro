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
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    border: '1px solid #eee'
                }}>
                    <Image
                        src="/logo.png"
                        alt="Logo CCOO"
                        width={40}
                        height={40}
                        style={{ width: 'auto', height: '80%' }}
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
