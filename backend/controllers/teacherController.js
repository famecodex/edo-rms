import asyncHandler from "express-async-handler";
import Teacher from "../models/teacherModel.js";
import bcrypt from "bcryptjs";

// @desc Create a teacher
// @route POST /api/teachers
// @access Principal or Ministry
export const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, subject, schoolId } = req.body;

  if (!name || !email || !password || !schoolId) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const exists = await Teacher.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Teacher already exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  const teacher = await Teacher.create({
    name,
    email,
    password: hashed,
    subject,
    schoolId,
  });

  res.status(201).json(teacher);
});

// @desc Get teachers by school
// @route GET /api/teachers
// @access Principal or Ministry
export const getTeachers = asyncHandler(async (req, res) => {
  const { schoolId } = req.query;
  const filter = schoolId ? { schoolId } : {};
  const teachers = await Teacher.find(filter).populate("schoolId", "schoolName");
  res.json(teachers);
});
