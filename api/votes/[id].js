// api/votes/[id].js - Delete vote by ID
import { deleteVoteById } from '../../services/votes.js';
import { verifyAuth } from '../../utils/auth.js';

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

        const deleted = await deleteVoteById({ userId: user.id, voteId: id });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Vote not found or not authorized to delete'
            });
        }

        return res.json({
            success: true,
            message: 'Vote deleted successfully'
        });
    } catch (error) {
        console.error('Delete vote error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error deleting vote'
        });
    }
}
