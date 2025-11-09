import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  authUser,
  logoutUser,
  getUserProfile,
  createUserByMinistry,
  getUsers,
  transferUser,
  registerMinistry,   // ✅ imported properly here
} from "../controllers/userController.js";

const router = express.Router();

// 🔑 LOGIN & LOGOUT
router.post("/login", authUser);
router.post("/logout", protect, logoutUser);

// 👤 GET PROFILE
router.get("/profile", protect, getUserProfile);

// 🏛 Ministry: create teacher/principal
router.post("/create", protect, authorizeRoles("ministry"), createUserByMinistry);

// 🏛 Ministry/Principal: view users (principals will see users from their school)
router.get("/", protect, authorizeRoles("ministry", "principal"), getUsers);

// 🏛 Ministry: transfer teacher/principal
router.put("/:id/transfer", protect, authorizeRoles("ministry"), transferUser);

// � Public route — used once to create the FIRST Ministry account
router.post("/register-ministry", registerMinistry);

export default router;
