// api/votes/index.js - Create vote
import { createVote, getVoteForUserAndCategory } from '../../services/votes.js';
import { getCategoryById } from '../../services/categories.js';
import { getNomineeById } from '../../services/nominees.js';
import { verifyAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
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

        const { category_id, nominee_id } = req.body;

        if (!category_id || !nominee_id) {
            return res.status(400).json({
                success: false,
                message: 'Category and nominee are required'
            });
        }

        // Validate category
        const category = await getCategoryById(category_id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        if (!category.votingEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Voting is disabled for this category'
            });
        }

        // Validate nominee
        const nominee = await getNomineeById(nominee_id);
        if (!nominee || nominee.category_id !== category_id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid nominee for this category'
            });
        }

        // Check for duplicate vote
        const existingVote = await getVoteForUserAndCategory({
            userId: user.id,
            categoryId: category_id
        });

        if (existingVote && !category.allowMultipleVotes) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this category'
            });
        }

        // Get IP address and user agent
        const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Create vote
        const vote = await createVote({
            userId: user.id,
            categoryId: category_id,
            nomineeId: nominee_id,
            ipAddress,
            userAgent
        });

        return res.status(201).json({
            success: true,
            message: 'Vote recorded successfully',
            data: vote
        });
    } catch (error) {
        console.error('Create vote error:', error);

        // Handle duplicate vote constraint error
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this category'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error creating vote'
        });
    }
}
