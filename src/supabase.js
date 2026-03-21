import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values from Supabase Dashboard → Settings → API
// Add them to Vercel as environment variables:
//   VITE_SUPABASE_URL  = https://xxxx.supabase.co
//   VITE_SUPABASE_ANON = your-anon-key
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://ehoztnrwozqqvbwcgjmc.supabase.co'
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob3p0bnJ3b3pxcXZid2Nnam1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwODg0NzYsImV4cCI6MjA4OTY2NDQ3Nn0.mkQHNDTCCNGJyZe4p1-LbhQCTmrrtgR_kpLOBD9qX9g'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
    storage:             localStorage,
  },
})
