// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ✅ Check for token in both cookie and Authorization header
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }

  try {
    // ✅ Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Your token generator likely used user._id → ensure compatibility
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      res.status(401);
      throw new Error('Invalid token structure');
    }

    // ✅ Find user and exclude password field
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    // ✅ Attach full user object to request
    req.user = user;

    // Debug log for development
    console.log(`🧠 Authenticated as: ${user.name} (${user.role})`);

    next();
  } catch (error) {
    console.error('JWT error:', error.message);
    res.status(401);
    throw new Error('Not authorized, invalid or expired token');
  }
});
