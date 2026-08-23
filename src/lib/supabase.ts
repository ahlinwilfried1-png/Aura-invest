import { createClient } from '@supabase/supabase-js';

// Central Authoritative Supabase Database Configuration
const CENTRAL_SUPABASE_URL = 'https://ozvqpwsdxkmimzfjmoud.supabase.co';
const CENTRAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dnFwd3NkeGttaW16Zmptb3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjI3NjMsImV4cCI6MjEwMjgzODc2M30.1IpuMkqP_hOE0cnmuSwT_031zNLXhx2pZA0-IBxbRX4';

const env = (import.meta as any).env || {};
const SUPABASE_URL = 
  env.NEXT_PUBLIC_SUPABASE_URL || 
  (env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') ? env.VITE_SUPABASE_URL : null) || 
  CENTRAL_SUPABASE_URL;

const SUPABASE_ANON_KEY = 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  (env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_ANON_KEY.includes('idnpfqfxvzskivpdkbdc') ? env.VITE_SUPABASE_ANON_KEY : null) || 
  CENTRAL_SUPABASE_ANON_KEY;

// Public Supabase client for client-side user operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

