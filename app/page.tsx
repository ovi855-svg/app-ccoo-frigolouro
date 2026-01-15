import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
    return (
        <main style={{
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative'
        }}>
            <div className="animate-fade-in-up" style={{
                textAlign: 'center',
                maxWidth: '900px',
                width: '100%',
                padding: '50px 30px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.6)'
            }}>
                <div style={{
                    marginBottom: '35px',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '130px',
                        height: '130px',
                        backgroundColor: 'white',
                        borderRadius: '32px',
                        padding: '20px',
                        boxShadow: '0 20px 40px -10px rgba(220, 38, 38, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 240, 240, 0.5)'
                    }}>
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

                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '15px',
                    letterSpacing: '-1.5px',
                    lineHeight: 1
                }}>
                    Sección Sindical <br />
                    <span style={{
                        color: 'var(--ccoo-red)',
                        background: 'linear-gradient(45deg, var(--ccoo-red) 30%, #ff4d4d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>CCOO Frigolouro</span>
                </h1>

                <p style={{
                    fontSize: '1.4rem',
                    color: '#64748b',
                    marginBottom: '50px',
                    maxWidth: '650px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    lineHeight: 1.5,
                    fontWeight: 500
                }}>
                    Plataforma de gestión integral para la representación sindical.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '25px',
                    justifyContent: 'center',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    {/* Tarjeta Orden del Día */}
                    <Link href="/orden-del-dia" style={{ textDecoration: 'none' }}>
                        <div className="hover:scale-105" style={{
                            padding: '30px',
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px',
                            transition: 'all 0.3s ease',
                            height: '100%'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--ccoo-red)',
                                marginBottom: '5px'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4"></path>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                </svg>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>Orden del Día</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Gestión de incidencias y temas pendientes</p>
                            </div>
                        </div>
                    </Link>

                    {/* Tarjeta Métodos y Tiempos (Ahora Gestión de Solicitudes) */}
                    <Link href="/metodos-tiempos" style={{ textDecoration: 'none' }}>
                        <div className="hover:scale-105" style={{
                            padding: '30px',
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px',
                            transition: 'all 0.3s ease',
                            height: '100%'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0284c7',
                                marginBottom: '5px'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>Métodos y Tiempos</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Gestión de Solicitudes</p>
                            </div>
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
        </main>
    )
}
