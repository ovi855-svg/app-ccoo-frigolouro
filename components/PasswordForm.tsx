'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function PasswordForm() {
    const [ready, setReady] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        async function initialize() {
            const supabase = createClient()
            const code = new URLSearchParams(window.location.search).get('code')
            const hash = new URLSearchParams(window.location.hash.slice(1))
            const access = hash.get('access_token')
            const refresh = hash.get('refresh_token')
            window.history.replaceState(null, '', '/auth/password')
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) { if (!cancelled) setError('El enlace ha caducado. Solicita uno nuevo desde la pantalla de acceso.'); return }
            }
            if (access && refresh) {
                const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh })
                if (error) { if (!cancelled) setError('El enlace ha caducado. Solicita uno nuevo desde la pantalla de acceso.'); return }
            }
            const { data: { user } } = await supabase.auth.getUser()
            const { data: member } = user ? await supabase.from('app_members').select('user_id')
                .eq('user_id', user.id).eq('active', true).maybeSingle() : { data: null }
            if (!cancelled) {
                if (member) setReady(true)
                else setError('Necesitas un enlace válido y una cuenta autorizada para configurar tu contraseña.')
            }
        }
        void initialize().catch(() => { if (!cancelled) setError('No se ha podido validar el enlace. Inténtalo de nuevo.') })
        return () => { cancelled = true }
    }, [])

    async function save(event: React.FormEvent) {
        event.preventDefault(); setError('')
        if (password.length < 12) { setError('Utiliza al menos 12 caracteres.'); return }
        if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return }
        setBusy(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ password })
            if (error) { setError('No se ha podido guardar la contraseña. Revisa el enlace y vuelve a intentarlo.'); return }
            await supabase.auth.signOut()
            window.location.replace('/login?mensaje=password')
        } catch { setError('No se ha podido conectar. Inténtalo de nuevo.') }
        finally { setBusy(false) }
    }

    return <main className="auth-container"><section className="auth-card">
        <h1>Configura tu contraseña</h1>
        <p className="auth-intro">Elige una contraseña personal de al menos 12 caracteres.</p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {ready && <form onSubmit={save}>
            <label htmlFor="new-password">Nueva contraseña</label>
            <input id="new-password" type="password" minLength={12} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} />
            <label htmlFor="confirmation">Repite la contraseña</label>
            <input id="confirmation" type="password" minLength={12} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required disabled={busy} />
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
        </form>}
        <Link className="auth-secondary" href="/login">Volver al acceso</Link>
    </section></main>
}
