'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navbar() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(path + '/')
    }

    const getLinkStyle = (path: string) => ({
        color: isActive(path) ? '#dc2626' : '#333',
        backgroundColor: isActive(path) ? '#fef2f2' : 'transparent',
        border: isActive(path) ? '1px solid #fee2e2' : '1px solid transparent',
    })

    return (
        <nav className="navbar-responsive">
            <Link href="/" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Logo con efecto hover */}
                    <div style={{
                        height: '50px',
                        width: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '5px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        {/* @ts-ignore */}
                        <Image
                            src="/logo.png"
                            alt="Logo CCOO"
                            width={40}
                            height={40}
                            style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{
                            fontWeight: '800',
                            fontSize: '1.2rem',
                            color: '#1e293b',
                            lineHeight: 1.1
                        }}>
                            Sección Sindical
                        </span>
                        <span style={{
                            fontWeight: '600',
                            fontSize: '1rem',
                            color: 'var(--ccoo-red)',
                            letterSpacing: '-0.5px'
                        }}>
                            CCOO Frigolouro
                        </span>
                    </div>
                </div>
            </Link>

            <div className="navbar-links">
                <Link href="/" className="navbar-link" style={getLinkStyle('/')}>
                    Inicio
                </Link>
                <Link href="/orden-del-dia" className="navbar-link" style={getLinkStyle('/orden-del-dia')}>
                    Orden del Día
                </Link>
                <Link href="/metodos-tiempos" className="navbar-link" style={getLinkStyle('/metodos-tiempos')}>
                    Métodos y Tiempos
                </Link>
                <Link href="/salud-laboral" className="navbar-link" style={getLinkStyle('/salud-laboral')}>
                    Salud Laboral
                </Link>
            </div>
        </nav>
    )
}
