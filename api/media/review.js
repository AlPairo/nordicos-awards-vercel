// api/media/review.js - Admin review media (approve/reject)
import { findMediaById, updateMediaStatus } from '../../services/media.js';
import { verifyAdminAuth } from '../../utils/auth.js';
import { supabase } from '../../utils/supabase.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const user = await verifyAdminAuth(req);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Admin access required'
            });
        }

        const { media_id, status, admin_notes } = req.body;

        if (!media_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Media ID and status are required'
            });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be approved or rejected'
            });
        }

        const media = await findMediaById(media_id);
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        // If rejected, delete from Supabase Storage
        if (status === 'rejected') {
            const { error } = await supabase.storage
                .from('media')
                .remove([media.file_path]);

            if (error) {
                console.error('Storage delete error:', error);
            }
        }

        // Update status in database
        const updated = await updateMediaStatus({
            mediaId: media_id,
            status,
            adminNotes: admin_notes,
            reviewerId: user.id
        });

        return res.json({
            success: true,
            message: `Media ${status} successfully`,
            data: updated
        });
    } catch (error) {
        console.error('Review media error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error reviewing media'
        });
    }
}
