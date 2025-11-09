// backend/controllers/studentController.js
import asyncHandler from "express-async-handler";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Transfer from "../models/transferModel.js";
import { generateSecurePassword, generateStudentEmail } from "../utils/studentAccount.js";

// Principal creates a student
// POST /api/students (principal only)
const createStudentByPrincipal = asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    gender, 
    dateOfBirth, 
    currentClass,
    guardianName,
    guardianPhone,
    guardianEmail,
    address
  } = req.body;

  // principal's schoolId is req.user.schoolId
  const schoolId = req.user.schoolId;
  
  // Validate required fields
  if (!firstName || !lastName || !gender || !dateOfBirth || !currentClass || 
      !guardianName || !guardianPhone || !guardianEmail || !address) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Generate student ID (you may want to customize this format)
  const year = new Date().getFullYear().toString().substr(-2);
  const count = await Student.countDocuments({ schoolId }) + 1;
  const studentId = `${year}${schoolId}${count.toString().padStart(4, '0')}`;

  // Create a user account for the student with secure credentials
  const initialPassword = generateSecurePassword(studentId);
  const email = generateStudentEmail(studentId, firstName, lastName);
  
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("A user account with this email already exists");
  }

  const user = await User.create({
    name: `${firstName} ${lastName}`,
    email,
    password: initialPassword,
    role: 'student',
    schoolId,
    approved: false, // Will be set to true when ministry approves the student
    createdBy: req.user._id
  });

  // Create student record with pending status and link to user account
  const student = await Student.create({
    studentId,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    currentClass,
    guardianName,
    guardianPhone,
    guardianEmail,
    address,
    schoolId,
    status: 'pending',
    createdBy: req.user._id,
    user: user._id // Link to user account
  });

  res.status(201).json({
    student,
    userAccount: {
      email: user.email,
      initialPassword,
      note: 'Please securely share these credentials with the student/guardian'
    }
  });
});

// GET /api/students?schoolId=...
const getStudents = asyncHandler(async (req, res) => {
  const rawSchoolId = req.query.schoolId;
  const normalize = (raw) => {
    if (!raw) return undefined;
    if (raw === "[object Object]") return req.user?.schoolId;
    try {
      const p = JSON.parse(raw);
      if (p && p._id) return p._id;
      if (typeof p === 'string') return p;
    } catch (e) {}
    return raw;
  };
  const schoolId = normalize(rawSchoolId);
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

// Ministry approves a student (makes `status` active)
// PUT /api/students/:id/approve (ministry only)
const approveStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('schoolId', 'schoolName');
  
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  if (student.status === 'active') {
    res.status(400);
    throw new Error("Student is already approved");
  }

  // Update student status
  student.status = "active";
  student.approvedBy = req.user._id;
  student.approvedAt = new Date();
  await student.save();

  // Always expect and activate the linked user account
  if (!student.user) {
    res.status(400);
    throw new Error("Student has no linked user account. Contact support.");
  }

  const studentUser = await User.findById(student.user);
  if (!studentUser) {
    res.status(400);
    throw new Error("Student's user account not found. Contact support.");
  }

  // Activate the student's user account
  studentUser.approved = true;
  await studentUser.save();

  res.json({ 
    message: "Student and user account approved successfully", 
    student,
    userActivated: true
  });
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

// GET /api/students/:id
const getStudentById = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  // If user is a student, they can only view their own profile
  // Compare as strings to avoid ObjectId vs string inequality
  if (req.user.role === 'student' && String(req.user._id) !== String(studentId)) {
    res.status(403);
    throw new Error('Not authorized to view this student profile');
  }

  const student = await Student.findOne({ user: studentId })
    // School model uses `schoolName` and `address` fields
    .populate('schoolId', 'schoolName address')
    .populate('user', 'email name');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  res.json(student);
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
  getStudentById,
};
