// backend/controllers/gradeController.js
import asyncHandler from "express-async-handler";
import Grade from "../models/gradeModel.js";
import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";

// POST /api/grades  (teacher/principal/ministry) create/update grade
const upsertGrade = asyncHandler(async (req, res) => {
  const { studentId, subject, courseId, score, examType } = req.body;
  const teacherId = req.user._id;
  const schoolId = req.user.schoolId;

  // Accept either a subject string or a courseId (preferred from frontend)
  let finalSubject = subject;
  if (!finalSubject && courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(400);
      throw new Error('Invalid courseId');
    }
    finalSubject = course.title || course.name || course.courseCode;
  }

  if (!studentId || !finalSubject || score === undefined) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  // optionally check teacher belongs to same school or has permission
  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404); throw new Error("Student not found");
  }
  if (String(student.schoolId) !== String(schoolId) && req.user.role !== "ministry") {
    res.status(403); throw new Error("Teacher can only grade students in their school");
  }

  // upsert: try to find existing grade by student/subject/examType
  const existing = await Grade.findOne({ studentId, subject: finalSubject, examType });
  if (existing) {
    existing.score = score;
    existing.teacherId = teacherId;
    await existing.save();
    return res.json(existing);
  }

  const grade = await Grade.create({ studentId, teacherId, schoolId, subject: finalSubject, score, examType });
  res.status(201).json(grade);
});

// GET /api/grades?schoolId=...&courseId=...&teacherId=...&studentId=... (teacher/ministry/student)
const getGrades = asyncHandler(async (req, res) => {
  const { schoolId, courseId, teacherId, studentId } = req.query;
  const filter = {};

  // If user is a student, they can only see their own grades
  if (req.user.role === 'student') {
    // The frontend passes user._id but we need the Student model _id
    // Try to find the student record by email or userId field
    const student = await Student.findOne({ 
      $or: [
        { email: req.user.email },
        { userId: req.user._id },
        { _id: studentId } // In case studentId in query is already the Student _id
      ]
    });
    
    if (!student) {
      console.log('No student record found for user:', req.user.email, req.user._id);
      return res.json([]); // No student record found, return empty grades
    }
    
    console.log('Found student record:', student._id);
    filter.studentId = student._id;
  } else {
    // For other roles, apply filters as provided
    if (schoolId) filter.schoolId = schoolId;
    if (teacherId) filter.teacherId = teacherId;
    if (studentId) filter.studentId = studentId;
  }

  // If courseId provided, translate to subject name
  if (courseId) {
    const course = await Course.findById(courseId);
    if (course) filter.subject = course.title || course.name || course.courseCode;
  }

  console.log('Grade filter:', filter);
  const grades = await Grade.find(filter)
    .populate("studentId", "firstName lastName email currentClass")
    .populate("teacherId", "name email");
  
  console.log('Found grades:', grades.length);
  res.json(grades);
});

// PUT /api/grades/:id  - update grade by studentId (frontend uses studentId as :id)
const updateGrade = asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  const { courseId, grade, score } = req.body;
  const teacherId = req.user._id;
  const schoolId = req.user.schoolId;
  
  const gradeValue = score !== undefined ? score : grade; // Accept either score or grade field

  if (!studentId || gradeValue === undefined) {
    res.status(400);
    throw new Error('studentId and grade/score are required');
  }

  let subject = req.body.subject;
  if (!subject && courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(400);
      throw new Error('Invalid courseId');
    }
    subject = course.title || course.name || course.courseCode;
  }

  if (!subject) {
    res.status(400);
    throw new Error('Subject or courseId is required to update grade');
  }

  // Try to find existing grade for this student/subject/examType (examType not passed here)
  const existing = await Grade.findOne({ studentId, subject });
  if (existing) {
    existing.score = Number(gradeValue);
    existing.teacherId = teacherId;
    await existing.save();
    return res.json(existing);
  }

  const created = await Grade.create({ studentId, teacherId, schoolId, subject, score: Number(gradeValue) });
  res.status(201).json(created);
});

export { upsertGrade, getGrades, updateGrade };