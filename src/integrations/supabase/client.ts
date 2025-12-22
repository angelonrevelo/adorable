// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded Supabase configuration (VITE_* vars not supported in Lovable)
const SUPABASE_URL = 'https://uwclgmhirtcluxnqkkms.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Y2xnbWhpcnRjbHV4bnFra21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzOTc1ODcsImV4cCI6MjA4MTk3MzU4N30.ce_p9ybVjZd42jyTF0FeLnD6I6VBIlrCinh2vprnaIU';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});