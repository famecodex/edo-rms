// backend/routes/studentRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createStudentByPrincipal,
  getStudents,
  updateStudent,
  deleteStudent,
  approveStudent,
  requestTransfer,
  principalApproveTransfer,
  ministryApproveTransfer,
} from "../controllers/studentController.js";

const router = express.Router();

// create student (principal creates; ministry can too)
router.post("/", protect, authorizeRoles("principal", "ministry"), createStudentByPrincipal);
router.get("/", protect, authorizeRoles("principal", "teacher", "ministry"), getStudents);
router.put("/:id", protect, authorizeRoles("principal", "ministry"), updateStudent);
router.delete("/:id", protect, authorizeRoles("principal", "ministry"), deleteStudent);

// student approval by ministry
router.put("/:id/approve", protect, authorizeRoles("ministry"), approveStudent);

// transfer flow
router.post("/:id/transfer-request", protect, authorizeRoles("student", "principal", "ministry"), requestTransfer);
router.put("/transfers/:id/principal-approve", protect, authorizeRoles("principal", "ministry"), principalApproveTransfer);
router.put("/transfers/:id/ministry-approve", protect, authorizeRoles("ministry"), ministryApproveTransfer);

export default router;
