import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
    return (
        <main className="home-container">
            <div className="animate-fade-in-up glass-panel">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="logo-container">
                        {/* @ts-ignore */}
                        <Image
                            src="/logo.png"
                            alt="Logo CCOO"
                            width={110}
                            height={110}
                            style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                            priority
                        />
                    </div>
                </div>

                <h1 className="title-main">
                    Sección Sindical <br />
                    <span className="gradient-text-red">CCOO Frigolouro</span>
                </h1>

                <p className="subtitle-main">
                    Plataforma de gestión integral para la representación sindical.
                </p>

                <div className="grid-home">
                    {/* Tarjeta Orden del Día */}
                    <Link href="/orden-del-dia" className="card-home">
                        <div className="icon-box" style={{ backgroundColor: '#fef2f2', color: 'var(--ccoo-red)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>Orden del Día</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Gestión de incidencias y temas pendientes</p>
                        </div>
                    </Link>

                    {/* Tarjeta Métodos y Tiempos */}
                    <Link href="/metodos-tiempos" className="card-home">
                        <div className="icon-box" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                            ⏱️
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>Métodos y Tiempos</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Solicitudes de revisión de ritmos</p>
                        </div>

                    </Link>

                    {/* Tarjeta Salud Laboral */}
                    <Link href="/salud-laboral" className="card-home">
                        <div className="icon-box" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                            🏥
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>Salud Laboral</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Incidencias y deficiencias en prevención</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Decoración de fondo sutil */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.03) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(60px)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-20%',
                    left: '-10%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.03) 0%, rgba(0,0,0,0) 70%)',
                    filter: 'blur(60px)'
                }} />
            </div>
        </main >
    )
}
