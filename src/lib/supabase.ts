import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://idnpfqfxvzskivpdkbdc.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnBmcWZ4dnpza2l2cGRrYmRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE3MjU3NSwiZXhwIjoyMTAxNzQ4NTc1fQ.V1115NnEKVJFGo16gZ2fMjfNI5wfooqk0gkHIpb6vso';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
