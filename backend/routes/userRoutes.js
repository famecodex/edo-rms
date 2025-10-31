// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createUserByMinistry,
  getUsers,
  transferUser,
  authUser,
  logoutUser,
  getUserProfile
} from "../controllers/userController.js";

const router = express.Router();

// 🔑 LOGIN & LOGOUT
router.post("/login", authUser);
router.post("/logout", protect, logoutUser);

// 👤 GET PROFILE
router.get("/profile", protect, getUserProfile);

// 🏛 Ministry: create teacher/principal
router.post("/create", protect, authorizeRoles("ministry"), createUserByMinistry);

// 🏛 Ministry: view all users
router.get("/", protect, authorizeRoles("ministry"), getUsers);

// 🏛 Ministry: transfer teacher/principal
router.put("/:id/transfer", protect, authorizeRoles("ministry"), transferUser);

// 🏗 Public route — only used once to create the first ministry account
import { registerMinistry } from "../controllers/userController.js";
router.post("/register-ministry", registerMinistry);


export default router;
