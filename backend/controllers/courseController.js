// backend/controllers/courseController.js
import asyncHandler from 'express-async-handler';
import Course from '../models/courseModel.js';
import AuditLog from '../models/auditModel.js';

// @desc Create a course
// @route POST /api/courses
// @access Private (principal/ministry)
const createCourse = asyncHandler(async (req, res) => {
  const { courseCode, title, level, schoolId } = req.body;
  const exists = await Course.findOne({ courseCode, schoolId });
  if (exists) {
    res.status(400);
    throw new Error('Course already exists for this school');
  }
  const course = await Course.create({ courseCode, title, level, schoolId });
  // audit
  await AuditLog.create({ action: 'CREATE_COURSE', collection: 'Course', documentId: course._id, performedBy: req.user._id });
  res.status(201).json(course);
});

// @desc Get courses for a school
// @route GET /api/courses?schoolId=...
// @access Private
const getCourses = asyncHandler(async (req, res) => {
  const { schoolId } = req.query;
  const query = {};
  if (schoolId) query.schoolId = schoolId;
  const courses = await Course.find(query);
  res.json(courses);
});

export { createCourse, getCourses };
