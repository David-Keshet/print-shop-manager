import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper function for better error handling
export const handleSupabaseError = (error, operation) => {
  console.error(`Supabase error during ${operation}:`, error)
  
  if (error.code === 'PGRST301') {
    return 'שגיאת הרשאות - יש לבדוק את מפתחות ה-API'
  }
  
  if (error.code === 'PGRST116') {
    return 'הרשומה לא נמצאה'
  }
  
  if (error.code === '23505') {
    return 'רשומה כפולה - הערך כבר קיים במערכת'
  }
  
  return error.message || 'שגיאה לא ידועה בחיבור למסד הנתונים'
}
