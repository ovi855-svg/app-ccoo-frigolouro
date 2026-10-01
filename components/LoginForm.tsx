'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export default function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('motivo') === 'sin-acceso') setError('Esta cuenta no tiene acceso autorizado.')
        if (params.get('motivo') === 'enlace') setError('El enlace ha caducado o no es válido. Solicita uno nuevo.')
        if (params.get('mensaje') === 'password') setMessage('Contraseña guardada. Ya puedes entrar.')
        // Invitations may use the implicit email flow. Finish it in the browser,
        // then remove tokens from the URL before opening another page.
        const hash = new URLSearchParams(window.location.hash.slice(1))
        const access = hash.get('access_token')
        const refresh = hash.get('refresh_token')
        if (access && refresh) {
            window.history.replaceState(null, '', '/login')
            void createClient().auth.setSession({ access_token: access, refresh_token: refresh }).then(({ error }) => {
                if (error) setError('No se ha podido validar el enlace. Solicita uno nuevo.')
                else window.location.replace('/auth/password')
            })
        }
    }, [])

    async function login(event: React.FormEvent) {
        event.preventDefault()
        setBusy(true); setError(''); setMessage('')
        try {
            const supabase = createClient()
            const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
            if (error || !data.user) { setError('No se ha podido entrar. Revisa tu correo y contraseña.'); return }
            const { data: member } = await supabase.from('app_members').select('user_id')
                .eq('user_id', data.user.id).eq('active', true).maybeSingle()
            if (!member) {
                await supabase.auth.signOut()
                setError('Esta cuenta no tiene acceso autorizado.')
                return
            }
            window.location.replace('/')
        } catch {
            setError('No se ha podido conectar. Inténtalo de nuevo.')
        } finally { setBusy(false) }
    }

    async function recover() {
        if (!email.trim()) { setError('Introduce tu correo para solicitar el enlace.'); return }
        setBusy(true); setError(''); setMessage('')
        try {
            const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/auth/password`,
            })
            if (error) setError('No se ha podido enviar el enlace. Inténtalo más tarde.')
            else setMessage('Si tu correo tiene una cuenta, recibirás un enlace para configurar la contraseña.')
        } catch { setError('No se ha podido conectar. Inténtalo de nuevo.') }
        finally { setBusy(false) }
    }

    return <main className="auth-container"><section className="auth-card">
        <Image src="/brand/ccoo-frigolouro-rojo.png" alt="CCOO Frigolouro" width={130} height={90} className="auth-brand-logo" priority />
        <h1>CCOO Frigolouro</h1>
        <p className="auth-intro">Acceso privado a la gestión sindical</p>
        <form onSubmit={login}>
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} />
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Un momento…' : 'Entrar'}</button>
        </form>
        <button className="auth-secondary" type="button" onClick={recover} disabled={busy}>Configurar o recuperar contraseña</button>
        <p className="auth-note">Solo pueden entrar las personas autorizadas.</p>
    </section></main>
}
