import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sección Sindical CCOO Frigolouro',
  description: 'Gestión de incidencias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}