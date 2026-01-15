'use client'

import { useState } from 'react'
import MetodosManager from '@/components/MetodosManager'
import MetodosInformeGenerator from '@/components/MetodosInformeGenerator'

export default function MetodosPage() {
    const [activeTab, setActiveTab] = useState<'gestion' | 'informe'>('gestion')

    return (
        <main style={{ paddingBottom: '50px' }}>
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
                <h1 style={{ color: '#1e293b', fontWeight: 800 }}>Métodos y Tiempos</h1>
                <p style={{ color: '#64748b' }}>Gestión de registros y tiempos</p>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <button
                    onClick={() => setActiveTab('gestion')}
                    style={{
                        padding: '15px 30px',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'gestion' ? '3px solid var(--ccoo-red)' : '3px solid transparent',
                        color: activeTab === 'gestion' ? 'var(--ccoo-red)' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Gestión de Métodos
                </button>
                <button
                    onClick={() => setActiveTab('informe')}
                    style={{
                        padding: '15px 30px',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'informe' ? '3px solid var(--ccoo-red)' : '3px solid transparent',
                        color: activeTab === 'informe' ? 'var(--ccoo-red)' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Generar Informe PDF
                </button>
            </div>

            <div style={{ maxWidth: activeTab === 'gestion' ? '1200px' : '800px', margin: '0 auto', padding: '0 20px' }}>
                {activeTab === 'gestion' ? (
                    <div className="animate-fade-in">
                        <MetodosManager />
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <MetodosInformeGenerator />
                    </div>
                )}
            </div>
        </main>
    )
}