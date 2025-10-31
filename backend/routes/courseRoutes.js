// backend/routes/courseRoutes.js
import express from "express";
import { createCourse, getCourses } from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Ministry and principal can add courses
router.post("/", protect, authorizeRoles("ministry", "principal"), createCourse);
router.get("/", protect, getCourses);

export default router;
