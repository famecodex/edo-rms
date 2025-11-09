// backend/controllers/authController.js
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { 
  generateResetToken, 
  hashResetToken, 
  verifyResetToken, 
  generateToken 
} from '../utils/tokenService.js';
import { 
  sendPasswordResetEmail, 
  sendPasswordChangedNotification 
} from '../utils/emailService.js';

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Input validation
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // For security, don't reveal if user exists
  if (!user) {
    res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    return;
  }

  // Check if user already requested reset within last 15 minutes
  if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now() - 900000) {
    res.status(429); // Too Many Requests
    throw new Error('Please wait 15 minutes before requesting another password reset');
  }

  // Generate reset token with expiry
  const resetToken = generateResetToken();
  user.resetPasswordToken = hashResetToken(resetToken);
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  try {
    await sendPasswordResetEmail(email, resetToken);
    
    // Log for monitoring (excluding sensitive data)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 Password reset requested for user ID: ${user._id}`);
    }

    res.json({ 
      message: 'If an account exists with this email, you will receive password reset instructions.' 
    });
  } catch (error) {
    // Reset token on email failure
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.error('Password reset email error:', error);
    res.status(500);
    throw new Error('Unable to send password reset email. Please try again later.');
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Input validation
  if (!password || password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long');
  }

  // Strong password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  // Find user with valid reset token
  const hashedToken = hashResetToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Password reset link is invalid or has expired');
  }

  // Prevent reuse of recent passwords (if implemented)
  const isSameAsCurrent = await user.matchPassword(password);
  if (isSameAsCurrent) {
    res.status(400);
    throw new Error('New password must be different from your current password');
  }

  // Set new password and clear reset token
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.lastPasswordChange = Date.now();
  
  try {
    await user.save();
    
    // Send notification
    await sendPasswordChangedNotification(user.email);

    // Log password change (excluding sensitive data)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 Password reset completed for user ID: ${user._id}`);
    }

    // Return success with new token
    const newToken = generateToken(user._id);
    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      message: 'Password has been reset successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500);
    throw new Error('Failed to reset password. Please try again.');
  }
});

// @desc    Change password (when logged in)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Input validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('All password fields are required');
  }

  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New password and confirmation do not match');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters long');
  }

  // Strong password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    res.status(400);
    throw new Error('New password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  // Prevent reuse of current password
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error('New password must be different from your current password');
  }

  try {
    // Set new password and update last change timestamp
    user.password = newPassword;
    user.lastPasswordChange = Date.now();
    await user.save();

    // Send notification
    await sendPasswordChangedNotification(user.email);

    // Log password change (excluding sensitive data)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 Password changed for user ID: ${user._id}`);
    }

    // Issue new token with updated iat
    const newToken = generateToken(user._id);
    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ 
      message: 'Password changed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500);
    throw new Error('Failed to change password. Please try again.');
  }
});