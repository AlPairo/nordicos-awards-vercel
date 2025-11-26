// api/auth/register.js - User registration endpoint
import { createUser, findUserByUsernameOrEmail } from '../../services/users.js';
import { generateToken } from '../../utils/auth.js';

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 50 characters'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if user exists
        const existingUser = await findUserByUsernameOrEmail({ username, email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create user
        const user = await createUser({ username, email, password });
        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { token, user }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
}
