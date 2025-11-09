// backend/routes/authRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  forgotPassword, 
  resetPassword, 
  changePassword 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);

export default router;