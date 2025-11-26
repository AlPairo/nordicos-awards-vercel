// api/nominees/index.js - List and create nominees
import { listNominees, createNominee } from '../../services/nominees.js';
import { getCategoryById } from '../../services/categories.js';
import { findMediaById } from '../../services/media.js';
import { verifyAdminAuth } from '../../utils/auth.js';

export default async function handler(req, res) {
    // GET: List nominees
    if (req.method === 'GET') {
        try {
            const categoryId = req.query.category_id;
            const onlyActive = req.query.only_active !== 'false';

            const nominees = await listNominees({ categoryId, onlyActive });

            return res.json({
                success: true,
                data: nominees
            });
        } catch (error) {
            console.error('List nominees error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error fetching nominees'
            });
        }
    }

    // POST: Create nominee (admin only)
    if (req.method === 'POST') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const { name, description, category, linked_media } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Nominee name is required'
                });
            }

            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Category is required'
                });
            }

            // Validate category exists
            const categoryExists = await getCategoryById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category'
                });
            }

            // Validate media if provided
            if (linked_media) {
                const mediaExists = await findMediaById(linked_media);
                if (!mediaExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid media ID'
                    });
                }
                if (mediaExists.status !== 'approved') {
                    return res.status(400).json({
                        success: false,
                        message: 'Media must be approved before linking'
                    });
                }
            }

            const nomineeId = await createNominee({
                ...req.body,
                createdBy: user.id
            });

            return res.status(201).json({
                success: true,
                message: 'Nominee created successfully',
                data: { id: nomineeId }
            });
        } catch (error) {
            console.error('Create nominee error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error creating nominee'
            });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
