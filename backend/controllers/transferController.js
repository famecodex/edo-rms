// backend/controllers/transferController.js
import asyncHandler from "express-async-handler";
import TransferRequest from "../models/transferRequestModel.js";
import User from "../models/userModel.js";
import School from "../models/schoolModel.js";
import Student from "../models/studentModel.js";

/**
 * 🧑‍🎓 Student: Create a transfer request
 * POST /api/transfer/request
 * access: student
 */
export const requestTransfer = asyncHandler(async (req, res) => {
  const { toSchool, reason, currentClass } = req.body;

  if (!toSchool || !reason) {
    res.status(400);
    throw new Error("Destination school and reason are required");
  }

  const student = await User.findById(req.user._id);
  if (!student || student.role !== "student") {
    res.status(403);
    throw new Error("Only students can request transfers");
  }

  const fromSchool = student.schoolId;
  if (!fromSchool) {
    res.status(400);
    throw new Error("Student is not assigned to a school");
  }

  const existing = await TransferRequest.findOne({
    student: student._id,
    status: { $in: ["pending", "principal_approved"] },
  });

  if (existing) {
    res.status(400);
    throw new Error("You already have a pending transfer request");
  }

  const request = await TransferRequest.create({
    student: student._id,
    fromSchool,
    toSchool,
    reason,
    studentClass: currentClass || student.currentClass || null,
  });

  res.status(201).json({
    message: "Transfer request submitted successfully",
    request,
  });
});

/**
 * 🧑‍🏫 Principal: Approve or reject transfer (Step 1)
 * PUT /api/transfer/:id/principal
 * access: principal
 * body: { action: 'approve' | 'reject' }
 */
export const principalDecision = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const request = await TransferRequest.findById(req.params.id)
    .populate("student", "name schoolId")
    .populate("toSchool", "schoolName");

  if (!request) {
    res.status(404);
    throw new Error("Transfer request not found");
  }

  if (request.status !== "pending") {
    res.status(400);
    throw new Error("Transfer is not awaiting principal approval");
  }

  if (req.user.schoolId.toString() !== request.fromSchool.toString()) {
    res.status(403);
    throw new Error("You can only manage requests from your own school");
  }

  if (action === "approve") {
    request.status = "principal_approved";
    request.principalApproved = true;
  } else {
    request.status = "principal_rejected";
    request.principalApproved = false;
  }

  await request.save();
  res.json({ message: `Principal ${action}d transfer`, request });
});

/**
 * 🏛 Ministry: Approve or reject transfer (Final step)
 * PUT /api/transfer/:id/ministry
 * access: ministry
 * body: { action: 'approve' | 'reject' }
 */
export const ministryDecision = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const request = await TransferRequest.findById(req.params.id).populate("student");

  if (!request) {
    res.status(404);
    throw new Error("Transfer request not found");
  }

  if (request.status !== "principal_approved") {
    res.status(400);
    throw new Error("Transfer is not awaiting ministry approval");
  }

  if (action === "approve") {
    // Mark as approved by ministry; the receiving principal must accept to finalize
    request.status = "ministry_approved";
    request.ministryApproved = true;
  } else {
    request.status = "ministry_rejected";
    request.ministryApproved = false;
  }

  await request.save();
  res.json({ message: `Transfer ${action}d successfully`, request });
});

/**
 * 🏫 Receiving Principal: Accept or reject student after ministry approval
 * PUT /api/transfer/:id/receive
 * access: principal (must be principal of the destination school)
 * body: { action: 'accept' | 'reject' }
 */
export const receiveDecision = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const request = await TransferRequest.findById(req.params.id).populate('student');

  if (!request) {
    res.status(404);
    throw new Error('Transfer request not found');
  }

  if (request.status !== 'ministry_approved') {
    res.status(400);
    throw new Error('Transfer is not awaiting receiving principal approval');
  }

  // Only the principal of the destination school can accept
  if (req.user.schoolId.toString() !== request.toSchool.toString()) {
    res.status(403);
    throw new Error('You can only accept transfers destined for your school');
  }

  if (action === 'accept') {
    request.status = 'destination_accepted';
    request.destinationAcceptedBy = req.user._id;
    request.destinationAcceptedAt = Date.now();

    // Move the student record(s) to the new school
    try {
      // Update User record if it exists
      const studentUser = await User.findById(request.student._id);
      if (studentUser && studentUser.role === 'student') {
        studentUser.schoolId = request.toSchool;
        await studentUser.save();
      }

      // Update Student document if linked by user reference
      const studentDoc = await Student.findOne({ user: request.student._id });
      if (studentDoc) {
        studentDoc.schoolId = request.toSchool;
        studentDoc.status = 'active';
        await studentDoc.save();
      }
    } catch (err) {
      // Log but continue — moving student is best-effort across models
      console.error('Failed to update student records on destination acceptance:', err);
    }
  } else {
    request.status = 'destination_rejected';
  }

  await request.save();
  res.json({ message: `Receiving principal ${action}ed transfer`, request });
});

/**
 * 📋 Get all transfer requests (filtered by role)
 * GET /api/transfer
 * access: principal, ministry, student
 */
export const getTransferRequests = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === "student") {
    filter.student = req.user._id;
  } else if (req.user.role === "principal") {
    // Principals should see both outgoing (from their school) and incoming (to their school) transfers
    filter = { $or: [{ fromSchool: req.user.schoolId }, { toSchool: req.user.schoolId }] };
  } else if (req.user.role === "ministry") {
    // Ministry only sees transfers that principals have approved
    filter.status = "principal_approved";
  }

  const requests = await TransferRequest.find(filter)
    .populate("student", "name email")
    .populate("fromSchool", "schoolName")
    .populate("toSchool", "schoolName")
    .sort({ createdAt: -1 });

  res.json(requests);
});

/**
 * 🧾 Student: View transfer history
 * GET /api/transfer/my-requests
 * access: student
 */
export const getMyTransferHistory = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    res.status(403);
    throw new Error("Only students can view their transfer history");
  }
  // Return a consistent array of transfer request documents (populated)
  const history = await TransferRequest.find({ student: req.user._id })
    .populate("fromSchool", "schoolName")
    .populate("toSchool", "schoolName")
    .sort({ createdAt: -1 });

  // Return array (empty array when none) to match the shape used by other list endpoints
  return res.json(history);
});
