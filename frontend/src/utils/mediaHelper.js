// Helper to get media URL from Supabase Storage
export const getMediaUrl = (filePath) => {
    if (!filePath) return '';

    // If it's already a full URL, return as-is
    if (filePath.startsWith('http')) return filePath;

    // Otherwise, construct Supabase Storage URL
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ierndyzmifwetjwgfooq.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/media/${filePath}`;
};
