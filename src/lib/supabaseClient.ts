import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hjwgcfqwjsalpimggtbk.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd2djZnF3anNhbHBpbWdndGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDQzMjAsImV4cCI6MjEwNTIyMDMyMH0.ae9QshKUbXwkqvvhWd9Q4OxrXMM4RcA7IwYKb2TmUuY';

export const isSupabaseConfigured = true;

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
});

