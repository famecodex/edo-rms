// backend/controllers/gradeController.js
import asyncHandler from "express-async-handler";
import Grade from "../models/gradeModel.js";
import Student from "../models/studentModel.js";

// POST /api/grades  (teacher/principal/ministry) create/update grade
const upsertGrade = asyncHandler(async (req, res) => {
  const { studentId, subject, score, examType } = req.body;
  const teacherId = req.user._id;
  const schoolId = req.user.schoolId;

  if (!studentId || !subject || score === undefined) {
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
  const existing = await Grade.findOne({ studentId, subject, examType });
  if (existing) {
    existing.score = score;
    existing.teacherId = teacherId;
    await existing.save();
    return res.json(existing);
  }

  const grade = await Grade.create({ studentId, teacherId, schoolId, subject, score, examType });
  res.status(201).json(grade);
});

// GET /api/grades?schoolId=...  (teacher/ministry)
const getGrades = asyncHandler(async (req, res) => {
  const { schoolId } = req.query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  const grades = await Grade.find(filter).populate("studentId", "studentId firstName lastName currentClass");
  res.json(grades);
});

export { upsertGrade, getGrades };
