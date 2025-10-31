// backend/controllers/studentController.js
import asyncHandler from "express-async-handler";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Transfer from "../models/transferModel.js";

// Principal creates a student (student user optional)
// POST /api/students  (principal, ministry)
const createStudentByPrincipal = asyncHandler(async (req, res) => {
  const { studentId, firstName, lastName, gender, dateOfBirth, currentClass, session } = req.body;

  // principal's schoolId is req.user.schoolId
  const schoolId = req.user.schoolId;
  if (!studentId || !firstName || !lastName || !currentClass) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  // create student record
  const exists = await Student.findOne({ studentId });
  if (exists) {
    res.status(400);
    throw new Error("Student with this studentId already exists");
  }

  // new student is created but if created by principal, set status pending until ministry approval for student account link
  const student = await Student.create({
    studentId,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    currentClass,
    session,
    schoolId,
    status: "pending",
  });

  res.status(201).json(student);
});

// GET /api/students?schoolId=...
const getStudents = asyncHandler(async (req, res) => {
  const { schoolId } = req.query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  const students = await Student.find(filter).populate("schoolId", "schoolName");
  res.json(students);
});

// PUT /api/students/:id (edit student) (principal/ministry)
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  Object.assign(student, req.body);
  await student.save();
  res.json(student);
});

// DELETE /api/students/:id (principal/ministry)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  await student.deleteOne();
  res.json({ message: "Student removed" });
});

// Ministry approves a student account to become active (makes `status` active)
// PUT /api/students/:id/approve (ministry)
const approveStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404); throw new Error("Student not found");
  }
  // if student has linked user, set user.approved true
  if (student.user) {
    const u = await User.findById(student.user);
    if (u) {
      u.approved = true;
      await u.save();
    }
  }
  student.status = "active";
  await student.save();
  res.json({ message: "Student approved", student });
});

// Student applies for transfer (or principal can initiate)
// POST /api/students/:id/transfer-request
// body: { toSchoolId, reason }
const requestTransfer = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404); throw new Error("Student not found");
  }
  const { toSchoolId, reason } = req.body;
  if (!toSchoolId || !reason) {
    res.status(400); throw new Error("toSchoolId and reason required");
  }
  const transfer = await Transfer.create({
    studentId: student._id,
    fromSchoolId: student.schoolId,
    toSchoolId,
    reason,
    requestedBy: req.user._id,
  });
  student.status = "transfer_pending";
  await student.save();
  res.status(201).json(transfer);
});

// Principal approves transfer (first step)
// PUT /api/transfers/:id/principal-approve  (principal of receiving school or current school — you decide policy)
const principalApproveTransfer = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id);
  if (!transfer) { res.status(404); throw new Error("Transfer not found"); }

  // optionally ensure req.user is principal of the toSchoolId
  if (String(req.user.schoolId) !== String(transfer.toSchoolId) && req.user.role !== "ministry") {
    res.status(403); throw new Error("Only receiving school's principal or ministry can approve at this step");
  }

  transfer.principalApproved = true;
  transfer.status = "principal_approved";
  await transfer.save();
  res.json({ message: "Principal approved transfer", transfer });
});

// Ministry final approves transfer and moves the student
// PUT /api/transfers/:id/ministry-approve
const ministryApproveTransfer = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id);
  if (!transfer) { res.status(404); throw new Error("Transfer not found"); }
  transfer.ministryApproved = true;
  transfer.status = "ministry_approved";
  await transfer.save();

  // perform move
  const student = await Student.findById(transfer.studentId);
  if (!student) { res.status(404); throw new Error("Student not found for transfer"); }
  student.schoolId = transfer.toSchoolId;
  student.status = "active";
  await student.save();

  transfer.status = "completed";
  await transfer.save();

  res.json({ message: "Transfer completed", transfer, student });
});

export {
  createStudentByPrincipal,
  getStudents,
  updateStudent,
  deleteStudent,
  approveStudent,
  requestTransfer,
  principalApproveTransfer,
  ministryApproveTransfer,
};
