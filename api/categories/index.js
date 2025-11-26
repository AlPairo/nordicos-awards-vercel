// api/categories/index.js - List categories and create category
import { fetchCategoriesWithNominees, createCategory } from '../../services/categories.js';
import { verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    // GET: List categories
    if (req.method === 'GET') {
        try {
            const activeOnly = req.query.active_only === 'true';
            const categories = await fetchCategoriesWithNominees({ activeOnly });

            return res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Get categories error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error fetching categories'
            });
        }
    }

    // POST: Create category (admin only)
    if (req.method === 'POST') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const { name, description, year, maxNominees, allowMultipleVotes, votingEnabled, order } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required'
                });
            }

            const category = await createCategory({
                name,
                description,
                year,
                maxNominees,
                allowMultipleVotes,
                votingEnabled,
                order,
                createdBy: user.id
            });

            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (error) {
            console.error('Create category error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error creating category'
            });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
