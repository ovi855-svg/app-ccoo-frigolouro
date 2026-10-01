import Link from 'next/link'
import AppIcon, {type IconName} from './AppIcon'
export default function PageHeader({title, description, icon, back}: {title: string; description: string; icon: IconName; back?: {href: string; label: string}}) {
 return <header className="page-heading">
  {back && <Link href={back.href} className="back-link"><AppIcon name="back" size={18}/>{back.label}</Link>}
  <div className="heading-row"><span className={`area-icon tone-${icon}`}><AppIcon name={icon} size={26}/></span><div><h1>{title}</h1><p>{description}</p></div></div>
 </header>
}
