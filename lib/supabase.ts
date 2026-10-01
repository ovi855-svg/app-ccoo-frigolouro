import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from './supabase-config'

export const createClient = () => {
    const { url, key } = supabaseConfig()
    return createBrowserClient(url, key)
}
