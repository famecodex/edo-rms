// backend/routes/gradeRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { upsertGrade, getGrades, updateGrade } from "../controllers/gradeController.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("teacher", "principal", "ministry"), upsertGrade);
router.get("/", protect, authorizeRoles("teacher", "principal", "ministry", "student"), getGrades);
router.put("/:id", protect, authorizeRoles("teacher", "principal", "ministry"), updateGrade);

export default router;
