import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfig } from './lib/supabase-config'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })
    const { url, key } = supabaseConfig()
    const supabase = createServerClient(url, key, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll(cookiesToSet, headers) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                response = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
            },
        },
    })
    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname
    const publicRoute = path === '/login' || path === '/auth/callback' || path === '/auth/confirm' || path === '/auth/password'
    if (!publicRoute) {
        const member = user ? await supabase.from('app_members').select('user_id')
            .eq('user_id', user.id).eq('active', true).maybeSingle() : null
        if (!user || !member?.data) {
            const target = request.nextUrl.clone()
            target.pathname = '/login'
            target.search = user ? '?motivo=sin-acceso' : ''
            const redirect = NextResponse.redirect(target)
            response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
            redirect.headers.set('Cache-Control', 'private, no-store')
            return redirect
        }
    }
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|brand/ccoo-frigolouro-rojo\\.png$|sw\\.js$|manifest\\.webmanifest$|pwa-icon/(?:192|512)$).*)'],
}
