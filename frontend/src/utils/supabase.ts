// src/utils/supabase.ts - Supabase client for frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get public URL for a file in Supabase Storage
 */
export const getMediaUrl = (filePath: string): string => {
    const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
    return data.publicUrl;
};

/**
 * Get signed URL for private media (1 hour expiry)
 */
export const getSignedMediaUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(filePath, 3600); // 1 hour

    if (error) {
        console.error('Error creating signed URL:', error);
        return '';
    }

    return data.signedUrl;
};
