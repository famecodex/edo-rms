// backend/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (res, user) => {
  // Make sure we pass the full user object or ID
  const payload = {
    userId: user._id || user.id || user,
    role: user.role, // helps for quick role checks if needed
  };

  // ✅ Sign JWT with clear payload and expiration
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // ✅ Set secure HTTP-only cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // true in production
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Optional debug log (remove in production)
  console.log(`🎟️ Token issued for user: ${user._id || user}`);

  return token;
};

export default generateToken;
