// api/auth/token.js - User login endpoint
import { findUserWithPassword, comparePassword } from '../../services/users.js';
import { generateToken } from '../../utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user
        const user = await findUserWithPassword(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Verify password
        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user.id);
        const { passwordHash, ...safeUser } = user;

        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                access_token: token,
                token_type: 'bearer',
                user: safeUser
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
}
