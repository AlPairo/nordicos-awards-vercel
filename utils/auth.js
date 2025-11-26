// utils/auth.js - JWT authentication utilities
import jwt from 'jsonwebtoken';
import { findUserById } from '../services/users.js';

export const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export const verifyAuth = async (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
        return null;
    }

    const user = await findUserById(decoded.id);
    return user;
};

export const verifyAdminAuth = async (req) => {
    const user = await verifyAuth(req);
    if (!user || user.role !== 'admin') {
        return null;
    }
    return user;
};
