// api/media/my.js - Get current user's media
import { listMediaForUser } from '../../services/media.js';
import { verifyAuth } from '../../utils/auth.js';

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

        const media = await listMediaForUser(user.id);

        return res.json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('Get user media error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching media'
        });
    }
}
