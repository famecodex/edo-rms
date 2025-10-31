import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createTeacher, getTeachers } from "../controllers/teacherController.js";

const router = express.Router();

router
  .route("/")
  .post(protect, authorizeRoles("principal", "ministry"), createTeacher)
  .get(protect, authorizeRoles("principal", "ministry"), getTeachers);

export default router;
