// api/categories/[id].js - Get, update, delete category by ID
import {
    getCategoryWithNominees,
    getCategoryById,
    updateCategory,
    deleteCategory,
    countNomineesInCategory
} from '../../services/categories.js';
import { verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    const { id } = req.query;

    // GET: Get single category
    if (req.method === 'GET') {
        try {
            const category = await getCategoryWithNominees(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            return res.json({
                success: true,
                data: category
            });
        } catch (error) {
            console.error('Get category error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error fetching category'
            });
        }
    }

    // PUT: Update category (admin only)
    if (req.method === 'PUT') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const category = await updateCategory(id, req.body);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            return res.json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } catch (error) {
            console.error('Update category error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error updating category'
            });
        }
    }

    // DELETE: Delete category (admin only)
    if (req.method === 'DELETE') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const category = await getCategoryById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const nomineeCount = await countNomineesInCategory(id);
            if (nomineeCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete category with existing nominees'
                });
            }

            await deleteCategory(id);

            return res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Delete category error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error deleting category'
            });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
