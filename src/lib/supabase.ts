import { createClient } from '@supabase/supabase-js';

// Support both Vite (VITE_) and Vercel / Next.js (NEXT_PUBLIC_) environment variables
const env = (import.meta as any).env || {};
const SUPABASE_URL = 
  env.NEXT_PUBLIC_SUPABASE_URL || 
  env.VITE_SUPABASE_URL || 
  'https://ozvqpwsdxkmimzfjmoud.supabase.co';

const SUPABASE_ANON_KEY = 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dnFwd3NkeGttaW16Zmptb3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjI3NjMsImV4cCI6MjEwMjgzODc2M30.1IpuMkqP_hOE0cnmuSwT_031zNLXhx2pZA0-IBxbRX4';

// Public Supabase client for client-side user operations (Sign up, login, read data, realtime subscriptions)
// Service role key is NEVER used on the client-side
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

