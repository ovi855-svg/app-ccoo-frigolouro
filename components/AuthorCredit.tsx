import type { AuthorStamp } from '@/lib/types'
import { creationAuthor } from '@/lib/authorship'

export default function AuthorCredit({record}: {record: AuthorStamp & {creada_por?: string|null}}) {
  return <div className="author-credit">
    <span>{creationAuthor(record)}</span>
    {record.updated_by_name && record.updated_at && <span>Último cambio: {record.updated_by_name} · <time dateTime={record.updated_at}>{new Date(record.updated_at).toLocaleString('es-ES')}</time></span>}
  </div>
}
