// backend/controllers/schoolController.js
import asyncHandler from "express-async-handler";
import School from "../models/schoolModel.js";
import User from "../models/userModel.js";

// POST /api/schools  (ministry)
const createSchool = asyncHandler(async (req, res) => {
  const { schoolName, address } = req.body;
  if (!schoolName) {
    res.status(400);
    throw new Error("schoolName required");
  }
  const school = await School.create({ schoolName, address });
  res.status(201).json(school);
});

// GET /api/schools  (ministry)
const getSchools = asyncHandler(async (req, res) => {
  const schools = await School.find().populate("principal", "name email");
  res.json(schools);
});

// GET /api/schools/:id
const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).populate("principal", "name email");
  if (!school) {
    res.status(404);
    throw new Error("School not found");
  }
  
  // For non-ministry users, check if they belong to this school
  if (req.user.role !== "ministry") {
    const userSchoolId = req.user.schoolId?.toString();
    const requestedSchoolId = school._id.toString();
    if (userSchoolId !== requestedSchoolId) {
      res.status(403);
      throw new Error("Not authorized to view this school");
    }
  }
  
  res.json(school);
});

// PUT /api/schools/:id (ministry)
const updateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) {
    res.status(404);
    throw new Error("School not found");
  }
  const { schoolName, address, principalId } = req.body;
  if (schoolName) school.schoolName = schoolName;
  if (address) school.address = address;
  if (principalId !== undefined) {
    school.principal = principalId || null;
    if (principalId) {
      // update user school assignment too
      const principal = await User.findById(principalId);
      if (principal) principal.schoolId = school._id, await principal.save();
    }
  }
  await school.save();
  res.json(school);
});

export { createSchool, getSchools, getSchoolById, updateSchool };
