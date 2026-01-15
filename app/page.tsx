import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
    return (
        <main style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '20px'
        }}>
            <div className="animate-fade-in-up" style={{
                textAlign: 'center',
                maxWidth: '800px',
                padding: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
                <div style={{
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        backgroundColor: 'white',
                        borderRadius: '30px',
                        padding: '15px',
                        boxShadow: '0 10px 30px -5px rgba(220, 38, 38, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* @ts-ignore - Supresión de error de tipos en build */}
                        <Image
                            src="/logo.png"
                            alt="Logo CCOO"
                            width={100}
                            height={100}
                            style={{ width: 'auto', height: '100%', objectFit: 'contain' }}
                            priority
                        />
                    </div>
                </div>

                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '10px',
                    letterSpacing: '-1px',
                    lineHeight: 1.1
                }}>
                    Sección Sindical <br />
                    <span style={{ color: 'var(--ccoo-red)' }}>CCOO Frigolouro</span>
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: '#64748b',
                    marginBottom: '40px',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    lineHeight: 1.6
                }}>
                    Plataforma de gestión para la sección sindical.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '20px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link href="/orden-del-dia" style={{
                        textDecoration: 'none',
                        padding: '18px 36px',
                        backgroundColor: 'var(--ccoo-red)',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        boxShadow: '0 10px 20px -5px rgba(220, 38, 38, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>Orden del Día</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                    <Link href="/metodos-tiempos" style={{
                        textDecoration: 'none',
                        padding: '18px 36px',
                        backgroundColor: 'white',
                        color: '#1e293b',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e2e8f0',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>Métodos y Tiempos</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Decoración de fondo */}
            <div style={{
                position: 'absolute',
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
                    top: '-10%',
                    left: '-10%',
                    width: '40%',
                    height: '40%',
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.05) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '-10%',
                    width: '40%',
                    height: '40%',
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.05) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%'
                }} />
            </div>
        </main>
    )
}
