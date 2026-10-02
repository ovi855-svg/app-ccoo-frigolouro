export type IconName = 'home' | 'agenda' | 'clock' | 'health' | 'people' | 'plus' | 'document' | 'arrow' | 'back' | 'edit' | 'search' | 'user' | 'lock' | 'bell'
const paths: Record<IconName, React.ReactNode> = {
 bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6" /></>,
 home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />,
 agenda: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-12 5 2 2 5-5" /></>,
 clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
 health: <><path d="M20 13v7H4V4h7m5-1v8m-4-4h8M2 13h5l2-4 4 8 2-4h7" /></>,
 people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2" /></>,
 plus: <path d="M12 5v14M5 12h14" />,
 document: <><path d="M14 3H5v18h14V8Zm0 0v5h5M8 12h8m-8 4h6" /></>,
 arrow: <path d="m9 5 7 7-7 7" />,
 back: <path d="m14 5-7 7 7 7M7 12h14" />,
 edit: <path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5" />,
 search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
 user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
 lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
}
export default function AppIcon({name, size=22}: {name: IconName; size?: number}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
