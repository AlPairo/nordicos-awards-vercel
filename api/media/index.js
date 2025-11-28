// api/media/index.js - Unified media handler
import formidable from 'formidable';
import fs from 'fs';
import {
    listMedia,
    listMediaForUser,
    listPendingMedia,
    createMediaUpload,
    findMediaById,
    updateMediaStatus,
    deleteMedia
} from '../../services/media.js';
import { verifyAuth, verifyAdminAuth } from '../../utils/auth.js';
import { supabase } from '../../utils/supabase.js';

// Disable body parser for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    const { action, id } = req.query;

    // GET /api/media?action=my - Get current user's media
    if (req.method === 'GET' && action === 'my') {
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

    // GET /api/media?action=pending - Get pending media (admin only)
    if (req.method === 'GET' && action === 'pending') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const media = await listPendingMedia();

            return res.json({
                success: true,
                data: media
            });
        } catch (error) {
            console.error('Get pending media error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error fetching pending media'
            });
        }
    }

    // GET /api/media - List all media (admin) or user media
    if (req.method === 'GET' && !action) {
        try {
            const user = await verifyAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const status = req.query.status;
            const isAdmin = user.role === 'admin';

            const media = await listMedia({
                status,
                isAdmin,
                userId: user.id
            });

            return res.json({
                success: true,
                data: media
            });
        } catch (error) {
            console.error('List media error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error fetching media'
            });
        }
    }

    // POST /api/media?action=create_metadata - Create metadata for file already uploaded to Supabase
    if (req.method === 'POST' && action === 'create_metadata') {
        try {
            const user = await verifyAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const { filename, original_filename, file_path, media_type, file_size, description } = req.body;

            // Validation
            if (!filename || !original_filename || !file_path || !media_type || !file_size) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Create metadata record
            const mediaUpload = await createMediaUpload({
                userId: user.id,
                filename,
                originalFilename: original_filename,
                filePath: file_path,
                mediaType: media_type,
                fileSize: file_size,
                description: description || '',
            });

            return res.json({
                success: true,
                message: 'Metadata created successfully',
                data: mediaUpload,
            });
        } catch (error) {
            console.error('Create metadata error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error creating metadata'
            });
        }
    }

    // POST /api/media?action=upload - Upload file to Supabase Storage (LEGACY - kept for backward compatibility)
    if (req.method === 'POST' && action === 'upload') {
        try {
            // Verify auth
            const user = await verifyAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            // Parse form data
            const form = formidable({
                multiples: false,
                maxFileSize: 50 * 1024 * 1024, // 50MB
            });

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error('Form parse error:', err);
                    return res.status(400).json({
                        success: false,
                        message: 'File upload failed'
                    });
                }

                // Formidable v3 returns files as arrays
                const fileArray = files.file;
                const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

                if (!file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file uploaded'
                    });
                }

                try {
                    // Generate unique filename
                    const timestamp = Date.now();
                    const randomStr = Math.random().toString(36).substring(7);

                    // Get file extension from originalFilename or newFilename
                    const originalName = file.originalFilename || file.newFilename || 'file';
                    const fileExt = originalName.split('.').pop() || 'bin';
                    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
                    const storagePath = `uploads/${user.id}/${fileName}`;

                    // Read file
                    const fileBuffer = fs.readFileSync(file.filepath);

                    // Upload to Supabase Storage
                    const { data, error } = await supabase.storage
                        .from('media')
                        .upload(storagePath, fileBuffer, {
                            contentType: file.mimetype || 'application/octet-stream',
                            upsert: false,
                        });

                    if (error) {
                        console.error('Supabase upload error:', error);
                        return res.status(500).json({
                            success: false,
                            message: 'Storage upload failed'
                        });
                    }

                    // Save metadata to database
                    const mediaType = (file.mimetype || '').startsWith('image/') ? 'photo' : 'video';
                    const description = Array.isArray(fields.description) ? fields.description[0] : (fields.description || '');

                    const mediaUpload = await createMediaUpload({
                        userId: user.id,
                        filename: fileName,
                        originalFilename: originalName,
                        filePath: data.path,
                        mediaType,
                        fileSize: file.size,
                        description,
                    });

                    // Clean up temp file
                    try {
                        fs.unlinkSync(file.filepath);
                    } catch (cleanupErr) {
                        console.warn('Failed to cleanup temp file:', cleanupErr);
                    }

                    return res.json({
                        success: true,
                        message: 'File uploaded successfully',
                        data: mediaUpload,
                    });
                } catch (error) {
                    console.error('Upload processing error:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Server error processing upload'
                    });
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error uploading file'
            });
        }
        return; // Exit early since formidable handles the response
    }

    // POST /api/media?action=review - Admin review media (approve/reject)
    if (req.method === 'POST' && action === 'review') {
        try {
            const user = await verifyAdminAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Admin access required'
                });
            }

            const { media_id, status, admin_notes } = req.body;

            if (!media_id || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Media ID and status are required'
                });
            }

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be approved or rejected'
                });
            }

            const media = await findMediaById(media_id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            // If rejected, delete from Supabase Storage
            if (status === 'rejected') {
                const { error } = await supabase.storage
                    .from('media')
                    .remove([media.file_path]);

                if (error) {
                    console.error('Storage delete error:', error);
                }
            }

            // Update status in database
            const updated = await updateMediaStatus({
                mediaId: media_id,
                status,
                adminNotes: admin_notes,
                reviewerId: user.id
            });

            return res.json({
                success: true,
                message: `Media ${status} successfully`,
                data: updated
            });
        } catch (error) {
            console.error('Review media error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error reviewing media'
            });
        }
    }

    // DELETE /api/media?id={id} - Delete media by ID
    if (req.method === 'DELETE' && id) {
        try {
            const user = await verifyAuth(req);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const media = await findMediaById(id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            // Check ownership (unless admin)
            if (user.role !== 'admin' && media.user_id !== user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this media'
                });
            }

            // Delete from Supabase Storage
            const { error } = await supabase.storage
                .from('media')
                .remove([media.file_path]);

            if (error) {
                console.error('Storage delete error:', error);
                // Continue anyway - file might not exist
            }

            // Delete from database
            await deleteMedia(id);

            return res.json({
                success: true,
                message: 'Media deleted successfully'
            });
        } catch (error) {
            console.error('Delete media error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error deleting media'
            });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
