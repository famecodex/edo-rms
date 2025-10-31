// backend/routes/gradeRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { upsertGrade, getGrades } from "../controllers/gradeController.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("teacher", "principal", "ministry"), upsertGrade);
router.get("/", protect, authorizeRoles("teacher", "principal", "ministry"), getGrades);

export default router;
