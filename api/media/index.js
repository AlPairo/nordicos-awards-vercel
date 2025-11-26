// api/media/index.js - List all media (admin) or user media
import { listMedia } from '../../services/media.js';
import { verifyAuth, verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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

        const status = req.query.status;
        const isAdmin = user.role === 'admin';

        const media = await listMedia({
            status,
            isAdmin,
            userId: user.id
        });

        return res.json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('List media error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching media'
        });
    }
}
