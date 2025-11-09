import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate password reset token
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate JWT token
export function generateToken(userId) {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
}

// Verify password reset token
export function verifyResetToken(token, hash) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === hash;
}

// Hash reset token for storage
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate temporary password
export function generateTempPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  return password;
}