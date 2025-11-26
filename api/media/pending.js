// api/media/pending.js - Get pending media (admin only)
import { listPendingMedia } from '../../services/media.js';
import { verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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

        const media = await listPendingMedia();

        return res.json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('Get pending media error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching pending media'
        });
    }
}
