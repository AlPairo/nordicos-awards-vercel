// api/auth/logout.js - User logout (client-side token removal)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Logout is client-side (remove token from localStorage)
    // This endpoint exists for consistency
    return res.json({
        success: true,
        message: 'Logged out successfully'
    });
}
