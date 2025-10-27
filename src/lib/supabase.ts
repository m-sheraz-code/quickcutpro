import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});

// Keep session persisted
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  } else {
    localStorage.removeItem('supabase.auth.token');
  }
});

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  monday_item_id: string | null;
  name: string;
  status: string;
  priority: string;
  due_date: string | null;
  file_url: string | null;
  file_name: string | null;
  grant_view: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  monday_feedback_id: string | null;
  created_at: string;
}
