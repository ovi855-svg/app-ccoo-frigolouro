import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{ 
      display: 'flex', 
      gap: '20px', 
      padding: '10px 0', 
      borderBottom: '1px solid #eee', 
      marginBottom: '20px',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/logo.png" alt="Logo CCOO" style={{ height: '40px' }} />
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>CCOO Frigolouro</div>
      </div>
      <div style={{ display: 'flex', gap: '15px' }}>
        <Link href="/incidencias" style={{ textDecoration: 'none', color: '#0070f3' }}>
          Incidencias
        </Link>
        <Link href="/informe" style={{ textDecoration: 'none', color: '#0070f3' }}>
          Informe PDF
        </Link>
      </div>
    </nav>
  )
}
