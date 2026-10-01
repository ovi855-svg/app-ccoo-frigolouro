'use client'
import Link from 'next/link'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import AccountMenu from './AccountMenu'
import AppIcon, {type IconName} from './AppIcon'
const links: {href: string; label: string; mobile: string; icon: IconName}[] = [
 {href: '/', label: 'Inicio', mobile: 'Inicio', icon: 'home'},
 {href: '/orden-del-dia', label: 'Orden del día', mobile: 'Orden', icon: 'agenda'},
 {href: '/metodos-tiempos', label: 'Métodos y tiempos', mobile: 'Métodos', icon: 'clock'},
 {href: '/salud-laboral', label: 'Salud laboral', mobile: 'Salud', icon: 'health'},
 {href: '/afiliados', label: 'Afiliación', mobile: 'Afiliación', icon: 'people'},
]
export default function Navbar() {
 const pathname = usePathname()
 if (pathname === '/login' || pathname.startsWith('/auth/')) return null
 const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href+'/')) || (href === '/orden-del-dia' && pathname.startsWith('/incidencias/'))
 return <>
  <a href="#main-content" className="skip-link">Ir al contenido</a>
  <header className="app-header"><div className="header-inner">
   <Link href="/" className="brand" aria-label="CCOO Frigolouro, inicio"><Image src="/logo.png" alt="CCOO" width={42} height={42} className="brand-logo" priority/><span><strong>CCOO Frigolouro</strong><small>Sección sindical</small></span></Link>
   <nav className="desktop-navigation" aria-label="Navegación principal">{links.map(link=><Link key={link.href} href={link.href} className="nav-link" aria-current={active(link.href)?'page':undefined}>{link.label}</Link>)}</nav>
   <AccountMenu/>
  </div></header>
  <nav className="mobile-navigation" aria-label="Navegación principal móvil">{links.map(link=><Link key={link.href} href={link.href} className="mobile-nav-link" aria-label={link.label} aria-current={active(link.href)?'page':undefined}><AppIcon name={link.icon}/><span>{link.mobile}</span></Link>)}</nav>
 </>
}
