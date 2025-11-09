// backend/routes/transferRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  requestTransfer,
  principalDecision,
  ministryDecision,
  receiveDecision,
  getTransferRequests,
  getMyTransferHistory,
} from "../controllers/transferController.js";

const router = express.Router();

/**
 * 🧑‍🎓 Student: create transfer request
 * POST /api/transfer/request
 */
router.post("/request", protect, authorizeRoles("student"), requestTransfer);

/**
 * 🧑‍🎓 Student: view own transfer history
 * GET /api/transfer/my-requests
 */
router.get("/my-requests", protect, authorizeRoles("student"), getMyTransferHistory);

/**
 * 🏫 Principal: approve or reject transfer
 * PUT /api/transfer/:id/principal
 * body: { action: 'approve' | 'reject' }
 */
router.put("/:id/principal", protect, authorizeRoles("principal"), principalDecision);

/**
 * 🏛 Ministry: final approval or rejection
 * PUT /api/transfer/:id/ministry
 * body: { action: 'approve' | 'reject' }
 */
router.put("/:id/ministry", protect, authorizeRoles("ministry"), ministryDecision);

/**
 * Receiving principal: accept or reject after ministry approval
 * PUT /api/transfer/:id/receive
 */
router.put("/:id/receive", protect, authorizeRoles("principal"), receiveDecision);

/**
 * 👥 Get all transfer requests
 * GET /api/transfer
 * - student: sees their own requests
 * - principal: sees from their school
 * - ministry: sees all
 */
router.get("/", protect, authorizeRoles("student", "principal", "ministry"), getTransferRequests);

export default router;
