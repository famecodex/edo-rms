import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import School from "../models/schoolModel.js";
import Course from "../models/courseModel.js";
import generateToken from "../utils/generateToken.js";

/**
 * @desc Auth User & Get Token
 * @route POST /api/users/login
 * @access Public
 */
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide both email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // For security, use same message for all auth failures
  const authError = "Login failed. Please check your credentials.";

  if (!user) {
    res.status(401);
    throw new Error(authError);
  }

  // Check user status
  if (user.status !== "active") {
    res.status(403);
    throw new Error("Your account is not active. Please contact administrator.");
  }

  // Check student approval
  if (user.role === "student" && !user.approved) {
    res.status(403);
    throw new Error("Your student account is awaiting ministry approval.");
  }

  // Check account lockout
  if (user.isLocked()) {
    const minutes = Math.ceil((user.lockoutUntil - Date.now()) / (60 * 1000));
    res.status(429);
    throw new Error(`Account is temporarily locked. Please try again in ${minutes} minutes.`);
  }

  try {
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error(authError);
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate token and set cookie
    const token = generateToken(res, user._id);

    // Return user info without sensitive data
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      courseId: user.courseId,
      approved: user.approved,
      lastLogin: user.lastLogin,
      token,
    });
  } catch (error) {
    // Log error details for monitoring (but don't expose to client)
    console.error(`Authentication error for ${email}:`, error.message);
    res.status(401);
    throw new Error(authError);
  }
});

/**
 * @desc Logout User
 * @route POST /api/users/logout
 * @access Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
});

/**
 * @desc Get Logged-In User Profile
 * @route GET /api/users/profile
 * @access Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("schoolId", "schoolName")
    .populate("courseId", "title");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

/**
 * @desc Ministry creates Teacher, Principal, or Student
 * @route POST /api/users/create
 * @access Ministry
 */
export const createUserByMinistry = asyncHandler(async (req, res) => {
  const { name, email, password, role, schoolId, courseId } = req.body;

  // Input validation
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("All fields are required: name, email, password, and role");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error(
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
    );
  }

  // Check for existing user
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("Email address is already registered");
  }

  // Validate role
  if (!["teacher", "principal", "student"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role. Must be teacher, principal, or student");
  }

  // Validate school for non-ministry users
  if (role !== "ministry" && !schoolId) {
    res.status(400);
    throw new Error("School ID is required for this role");
  }

  // Validate school exists if provided
  if (schoolId) {
    const school = await School.findById(schoolId);
    if (!school) {
      res.status(400);
      throw new Error("Invalid school ID");
    }
  }

  // Validate course for teachers
  if (role === "teacher") {
    if (!courseId) {
      res.status(400);
      throw new Error("Course ID is required for teachers");
    }
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(400);
      throw new Error("Invalid course ID");
    }
  }

  try {
    // Validate School exists if provided (again, safe-guard)
    if (schoolId) {
      const school = await School.findById(schoolId);
      if (!school) {
        res.status(400);
        throw new Error("Invalid school ID");
      }
    }

    // Validate Course for teachers
    if (role === "teacher") {
      const course = await Course.findById(courseId);
      if (!course) {
        res.status(400);
        throw new Error("Invalid course ID");
      }
    }

    // Create user with validated data
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      schoolId: schoolId || null,
      courseId: role === "teacher" ? courseId || null : null,
      approved: role !== "student",
      createdBy: req.user._id,
      status: "active",
      lastPasswordChange: Date.now()
    });

    // If principal, set school principal
    if (role === "principal" && schoolId) {
      await School.findByIdAndUpdate(schoolId, { principal: newUser._id });
    }

    // Log user creation
    if (process.env.NODE_ENV !== 'production') {
      console.log(`👤 New ${role} created: ${newUser._id} by ${req.user._id}`);
    }

    // Send response without sensitive data
    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        schoolId: newUser.schoolId,
        courseId: newUser.courseId,
        approved: newUser.approved
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to create user. Please try again.');
  }
});

/**
 * @desc Principal creates Student (pending approval)
 * @route POST /api/users/create-student
 * @access Principal
 */
export const createStudentByPrincipal = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("Student already exists");
  }

  const principal = req.user;
  const student = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "student",
    schoolId: principal.schoolId,
    approved: false,
    createdBy: principal._id,
  });

  res.status(201).json({
    message: "Student created and awaiting ministry approval",
    student,
  });
});

/**
 * @desc Ministry approves Student
 * @route PUT /api/users/:id/approve
 * @access Ministry
 */
export const approveStudent = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== "student") {
    res.status(404);
    throw new Error("Student not found");
  }

  student.approved = true;
  await student.save();
  res.json({ message: "Student approved successfully", student });
});

/**
 * @desc Get all users (optional ?role=teacher)
 * @route GET /api/users
 * @access Ministry
 */
export const getUsers = asyncHandler(async (req, res) => {
  try {
    const filter = {};

    // Role filter
    if (req.query.role) {
      filter.role = req.query.role;
    }

    // Principals should only see users from their school
    if (req.user && req.user.role === 'principal') {
      filter.schoolId = req.user.schoolId;
    } else if (req.query.schoolId && req.user && req.user.role === 'ministry') {
      // Ministry may filter by schoolId if provided
      filter.schoolId = req.query.schoolId;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("schoolId", "schoolName")
      .populate("courseId", "title");

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500);
    throw new Error('Failed to fetch users');
  }
});

/**
 * @desc Transfer Teacher/Principal
 * @route PUT /api/users/:id/transfer
 * @access Ministry
 */
export const transferUser = asyncHandler(async (req, res) => {
  const { toSchoolId } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!["teacher", "principal"].includes(user.role)) {
    res.status(400);
    throw new Error("Only teacher or principal can be transferred");
  }

  user.schoolId = toSchoolId;
  await user.save();

  if (user.role === "principal") {
    await School.updateMany({ principal: user._id }, { $unset: { principal: "" } });
    await School.findByIdAndUpdate(toSchoolId, { principal: user._id });
  }

  res.json({ message: "User transferred successfully", user });
});

/**
 * @desc Register the FIRST Ministry Account
 * @route POST /api/users/register-ministry
 * @access Public (run once)
 */
export const registerMinistry = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ role: "ministry" });
  if (exists) {
    res.status(403);
    throw new Error("Ministry account already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "ministry",
    approved: true,
  });

  res.status(201).json({
    message: "Ministry account created successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});
