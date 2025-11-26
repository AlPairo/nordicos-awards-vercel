// api/media/[id].js - Delete media by ID
import { findMediaById, deleteMedia } from '../../services/media.js';
import { verifyAuth } from '../../utils/auth.js';
import { supabase } from '../../utils/supabase.js';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const user = await verifyAuth(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const media = await findMediaById(id);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        // Check ownership (unless admin)
        if (user.role !== 'admin' && media.user_id !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this media'
            });
        }

        // Delete from Supabase Storage
        const { error } = await supabase.storage
            .from('media')
            .remove([media.file_path]);

        if (error) {
            console.error('Storage delete error:', error);
            // Continue anyway - file might not exist
        }

        // Delete from database
        await deleteMedia(id);

        return res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        console.error('Delete media error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error deleting media'
        });
    }
}
