import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// For client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client-side helper
export const createClientComponentClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
