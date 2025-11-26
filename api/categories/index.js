// api/categories/index.js - Unified categories handler
import {
    fetchCategoriesWithNominees,
    createCategory,
    getCategoryWithNominees,
    getCategoryById,
    updateCategory,
    deleteCategory,
    countNomineesInCategory
} from '../../services/categories.js';
import { verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    const { id } = req.query;

    // GET: Get single category by ID or list all categories
    if (req.method === 'GET') {
        try {
            // Single category: GET /api/categories?id={id}
            if (id) {
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
            }

            // List categories: GET /api/categories
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

    // PUT: Update category by ID (admin only)
    if (req.method === 'PUT') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Category ID is required'
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

    // DELETE: Delete category by ID (admin only)
    if (req.method === 'DELETE') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Category ID is required'
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
