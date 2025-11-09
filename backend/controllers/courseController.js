// backend/controllers/courseController.js
import asyncHandler from "express-async-handler";
import Course from "../models/courseModel.js";
import School from "../models/schoolModel.js";
import AuditLog from "../models/auditModel.js";
import User from "../models/userModel.js";

// 🏫 Ministry or Principal: Create a new course
// POST /api/courses
// access: ministry, principal
export const createCourse = asyncHandler(async (req, res) => {
  const { courseCode, title, level, schoolId } = req.body;

  if (!courseCode || !title || !schoolId) {
    res.status(400);
    throw new Error("Course code, title, and school are required");
  }

  // Validate schoolId format
  if (!schoolId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400);
    throw new Error("Invalid school ID format");
  }

  // Check if school exists
  const school = await School.findById(schoolId);
  if (!school) {
    res.status(404);
    throw new Error("School not found");
  }

  // Check if course code already exists in this school
  const exists = await Course.findOne({ courseCode, schoolId });
  if (exists) {
    res.status(400);
    throw new Error("Course already exists for this school");
  }

  const course = await Course.create({ courseCode, title, level, schoolId });

  await AuditLog.create({
    action: "CREATE_COURSE",
    targetCollection: "Course",
    documentId: course._id,
    performedBy: req.user._id,
  });

  res.status(201).json({ message: "Course created successfully", course });
});

// 🧑‍🏫 Ministry or Principal: Assign teacher to a course
// PUT /api/courses/:id/assign
// body: { teacherId }
// access: ministry or principal
export const assignTeacherToCourse = asyncHandler(async (req, res) => {
  const { teacherId } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    res.status(400);
    throw new Error("Invalid teacher");
  }

  teacher.courseId = course._id;
  await teacher.save();

  await AuditLog.create({
    action: "ASSIGN_TEACHER_COURSE",
    targetCollection: "User",
    documentId: teacher._id,
    performedBy: req.user._id,
  });

  res.json({
    message: `${teacher.name} has been assigned to ${course.title}`,
    teacher,
  });
});

// 📚 Get all courses (filter by schoolId)
// GET /api/courses?schoolId=...
// access: ministry, principal, teacher
export const getCourses = asyncHandler(async (req, res) => {
  const { schoolId, teacherId } = req.query;

  // If teacherId provided, return that teacher's assigned course (if any)
  if (teacherId) {
    const teacher = await User.findById(teacherId).populate('courseId');
    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found');
    }
    if (!teacher.courseId) return res.json([]);
    const course = await Course.findById(teacher.courseId._id).populate('schoolId', 'schoolName');
    return res.json(course ? [course] : []);
  }

  const query = schoolId ? { schoolId } : {};
  const courses = await Course.find(query).populate("schoolId", "schoolName");
  res.json(courses);
});

// 👩‍🏫 Teacher: Get their assigned course
// GET /api/courses/my
// access: teacher
export const getMyCourse = asyncHandler(async (req, res) => {
  const teacher = await User.findById(req.user._id).populate("courseId");
  if (!teacher || teacher.role !== "teacher") {
    res.status(403);
    throw new Error("Only teachers can access their course");
  }

  if (!teacher.courseId) {
    return res.json({ message: "No course assigned yet", course: null });
  }

  res.json({ message: "Course retrieved successfully", course: teacher.courseId });
});
