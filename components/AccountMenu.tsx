'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function AccountMenu() {
    const [name, setName] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    useEffect(() => {
        let cancelled = false
        const supabase = createClient()
        void supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return
            const { data } = await supabase.from('app_members').select('display_name')
                .eq('user_id', user.id).eq('active', true).maybeSingle()
            if (!cancelled && data) setName(data.display_name)
        }).catch(() => {})
        return () => { cancelled = true }
    }, [])
    async function logout() {
        setBusy(true); setError('')
        try {
            const { error } = await createClient().auth.signOut()
            if (error) { setError('No se ha podido cerrar la sesión.'); return }
            window.location.replace('/login')
        } catch { setError('No se ha podido cerrar la sesión. Inténtalo de nuevo.') }
        finally { setBusy(false) }
    }
    return <div className="account-menu">
        {name && <span>{name}</span>}
        <button type="button" onClick={logout} disabled={busy}>{busy ? 'Saliendo…' : 'Cerrar sesión'}</button>
        {error && <span role="alert">{error}</span>}
    </div>
}
