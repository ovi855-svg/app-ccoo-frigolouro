import {requireMember} from '@/lib/require-member'
import NotificationsManager from '@/components/NotificationsManager'

export default async function NotificationsPage(){
 await requireMember()
 return <main id="main-content" className="page-container"><div className="page-header"><div><p className="page-eyebrow">CCOO Frigolouro</p><h1>Avisos</h1><p>Cambios de las demás personas y preferencias del móvil.</p></div></div><NotificationsManager/></main>
}
