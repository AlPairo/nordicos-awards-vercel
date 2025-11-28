// Frontend Supabase client for direct storage uploads
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Direct uploads will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
