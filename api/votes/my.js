// api/votes/my.js - Get current user's votes
import { getVotesByUser } from '../../services/votes.js';
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

        const votes = await getVotesByUser(user.id);

        return res.json({
            success: true,
            data: votes
        });
    } catch (error) {
        console.error('Get user votes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching votes'
        });
    }
}
