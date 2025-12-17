import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://wmuowsqzbrqgtbmunkdx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtdW93c3F6YnJxZ3RibXVua2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODg1MDksImV4cCI6MjA4MTU2NDUwOX0.cznd3NQoQjl6Hgt0r6_lTyR4TxETiJXW4lMA8Pz-Gq8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
