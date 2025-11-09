// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  let source = 'none';

  // Check for token in cookie (preferred)
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
    source = 'cookie';
  } 
  // Fallback to Authorization header
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    source = 'header';
  }

  if (!token) {
    res.status(401);
    throw new Error('Authentication required. Please log in.');
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID with fallbacks
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      console.error('⚠️ Token missing user ID:', decoded);
      res.status(401);
      throw new Error('Invalid authentication token');
    }

    // Find user and exclude sensitive fields
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();

    if (!user) {
      console.error(`⚠️ No user found for ID: ${userId}`);
      res.status(401);
      throw new Error('User account not found or deactivated');
    }

    // Check if user is active/approved based on role
    if (user.role === 'student' && !user.approved) {
      res.status(403);
      throw new Error('Account pending approval');
    }

    // Attach user to request object
    req.user = user;
    req.tokenSource = source; // For debugging/metrics

    // Log authentication (exclude in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 Auth [${source}]: ${user.name} (${user.role})`);
    }

    next();
  } catch (error) {
    console.error('JWT error:', error.message);
    res.status(401);
    throw new Error('Not authorized, invalid or expired token');
  }
});
