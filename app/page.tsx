import {requireMember} from '@/lib/require-member'
import Link from 'next/link'
import AppIcon, {type IconName} from '@/components/AppIcon'
const areas: {href: string; title: string; text: string; icon: IconName}[] = [
 {href: '/orden-del-dia', title: 'Orden del día', text: 'Incidencias y temas para la próxima reunión.', icon: 'agenda'},
 {href: '/metodos-tiempos', title: 'Métodos y tiempos', text: 'Seguimiento de ritmos y solicitudes de revisión.', icon: 'clock'},
 {href: '/salud-laboral', title: 'Salud laboral', text: 'Prevención, riesgos y condiciones de trabajo.', icon: 'health'},
 {href: '/afiliados', title: 'Afiliación', text: 'Fichas, contactos y gestiones de cada persona.', icon: 'people'},
]
export default async function Home() {
 await requireMember()
 return <main id="main-content" className="page-container home-container">
  <section className="home-welcome">
   <div className="welcome-top"><div className="welcome-eyebrow"><span/>TU ESPACIO DE TRABAJO</div><span className="private-tag"><AppIcon name="lock" size={14}/>Privado</span></div>
   <h1>La sección sindical,<br/><span>siempre a mano.</span></h1>
   <p>Fichas, incidencias y gestiones, en un mismo lugar.</p>
  </section>
  <section className="home-section" aria-labelledby="areas-heading">
   <div className="section-heading"><h2 id="areas-heading">¿En qué vamos a trabajar?</h2><span>4 áreas</span></div>
   <div className="grid-home">{areas.map(area=><Link href={area.href} key={area.href} className="card-home"><span className={`area-icon tone-${area.icon}`}><AppIcon name={area.icon} size={27}/></span><div><h3>{area.title}</h3><p>{area.text}</p></div><span className="card-arrow"><AppIcon name="arrow" size={20}/></span></Link>)}</div>
  </section>
  <section className="home-section" aria-labelledby="quick-heading">
   <div className="section-heading"><h2 id="quick-heading">Registrar algo nuevo</h2></div>
   <div className="quick-actions"><Link href="/incidencias/nueva"><AppIcon name="plus"/><span>Incidencia</span></Link><Link href="/metodos-tiempos/nueva"><AppIcon name="plus"/><span>Solicitud de revisión</span></Link><Link href="/salud-laboral/nueva"><AppIcon name="plus"/><span>Salud laboral</span></Link></div>
  </section>
 </main>
}
