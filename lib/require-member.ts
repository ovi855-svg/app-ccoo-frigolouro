import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabase } from './supabase-server'

// Revalidate identity on the server and membership in the database on every request.
// The database policies enforce the same rule for direct API access.
export const requireMember = cache(async () => {
    const supabase = await createServerSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) redirect('/login')
    const { data: member } = await supabase.from('app_members')
        .select('display_name').eq('user_id', user.id).eq('active', true).maybeSingle()
    if (!member) redirect('/login?motivo=sin-acceso')
    return { user, displayName: member.display_name as string }
})
