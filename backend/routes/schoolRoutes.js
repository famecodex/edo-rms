// backend/routes/schoolRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createSchool, getSchools, getSchoolById, updateSchool } from "../controllers/schoolController.js";

const router = express.Router();

router.route("/")
  .post(protect, authorizeRoles("ministry"), createSchool)
  // allow students/principals/teachers to list schools (needed for transfer requests and selection UIs)
  .get(protect, authorizeRoles("ministry", "principal", "teacher", "student"), getSchools);

router.route("/:id")
  .get(protect, authorizeRoles("ministry", "principal", "teacher", "student"), getSchoolById)
  .put(protect, authorizeRoles("ministry"), updateSchool);

export default router;
