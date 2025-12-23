// api/auth/index.js - Unified auth handler
import {
  createUser,
  findUserByUsernameOrEmail,
  findUserWithPassword,
  comparePassword,
} from "../../services/users.js";
import { generateToken, verifyAuth } from "../../utils/auth.js";

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.status(200).end();
  }

  // Set CORS headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  const { action } = req.query;

  // POST /api/auth?action=register - User registration
  if (req.method === "POST" && action === "register") {
    try {
      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 50 characters",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Check if user exists
      const existingUser = await findUserByUsernameOrEmail({ username, email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Create user
      const user = await createUser({ username, email, password });
      const token = generateToken(user.id);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { token, user },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  }

  // POST /api/auth?action=token - User login
  if (req.method === "POST" && action === "token") {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
      }

      // Find user
      const user = await findUserWithPassword(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      // Verify password
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate token
      const token = generateToken(user.id);
      const { passwordHash, ...safeUser } = user;

      return res.json({
        success: true,
        message: "Login successful",
        data: {
          access_token: token,
          token_type: "bearer",
          user: safeUser,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during login",
      });
    }
  }

  // POST /api/auth?action=logout - User logout
  if (req.method === "POST" && action === "logout") {
    // Logout is client-side (remove token from localStorage)
    // This endpoint exists for consistency
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  }

  // GET /api/auth?action=me - Get current user profile
  if (req.method === "GET" && action === "me") {
    try {
      const user = await verifyAuth(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      return res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error fetching profile",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
