// api/votes/results.js - Get voting results
import { getResults } from '../../services/votes.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const categoryId = req.query.category_id;
        const results = await getResults({ categoryId });

        return res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Get results error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching results'
        });
    }
}
