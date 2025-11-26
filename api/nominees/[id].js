// api/nominees/[id].js - Get, update, delete nominee by ID
import { getNomineeById, updateNominee, deleteNominee } from '../../services/nominees.js';
import { getCategoryById } from '../../services/categories.js';
import { findMediaById } from '../../services/media.js';
import { verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    const { id } = req.query;

    // GET: Get single nominee
    if (req.method === 'GET') {
        try {
            const nominee = await getNomineeById(id);
            if (!nominee) {
                return res.status(404).json({
                    success: false,
                    message: 'Nominee not found'
                });
            }

            return res.json({
                success: true,
                data: nominee
            });
        } catch (error) {
            console.error('Get nominee error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error fetching nominee'
            });
        }
    }

    // PUT: Update nominee (admin only)
    if (req.method === 'PUT') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const nominee = await getNomineeById(id);
            if (!nominee) {
                return res.status(404).json({
                    success: false,
                    message: 'Nominee not found'
                });
            }

            // Validate category if provided
            if (req.body.category) {
                const categoryExists = await getCategoryById(req.body.category);
                if (!categoryExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category'
                    });
                }
            }

            // Validate media if provided
            if (req.body.linked_media) {
                const mediaExists = await findMediaById(req.body.linked_media);
                if (!mediaExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid media ID'
                    });
                }
            }

            await updateNominee(id, req.body);

            return res.json({
                success: true,
                message: 'Nominee updated successfully'
            });
        } catch (error) {
            console.error('Update nominee error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error updating nominee'
            });
        }
    }

    // DELETE: Delete nominee (admin only)
    if (req.method === 'DELETE') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const nominee = await getNomineeById(id);
            if (!nominee) {
                return res.status(404).json({
                    success: false,
                    message: 'Nominee not found'
                });
            }

            await deleteNominee(id);

            return res.json({
                success: true,
                message: 'Nominee deleted successfully'
            });
        } catch (error) {
            console.error('Delete nominee error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error deleting nominee'
            });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
