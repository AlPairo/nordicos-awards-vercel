// api/media/upload.js - Upload file to Supabase Storage
import formidable from 'formidable';
import fs from 'fs';
import { createMediaUpload } from '../../services/media.js';
import { verifyAuth } from '../../utils/auth.js';
import { supabase } from '../../utils/supabase.js';

// Disable body parser for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

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
}
