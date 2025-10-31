import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import School from "../models/schoolModel.js";
import generateToken from "../utils/generateToken.js";


// Create the first ministry account manually
export const registerMinistry = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
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
    _id: user._id,
    email: user.email,
  });
});


/* =========================================================
   1️⃣ AUTH LOGIN
   ========================================================= */
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // only approved users can log in
  if (user.role === "student" && !user.approved) {
    res.status(403);
    throw new Error("Student account not yet approved by Ministry");
  }

  const token = generateToken(res, user._id);
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    approved: user.approved,
    token,
  });
});

/* =========================================================
   2️⃣ LOGOUT
   ========================================================= */
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
});

/* =========================================================
   3️⃣ GET USER PROFILE
   ========================================================= */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password").populate("schoolId", "schoolName");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

/* =========================================================
   4️⃣ MINISTRY CREATE PRINCIPAL/TEACHER
   ========================================================= */
export const createUserByMinistry = asyncHandler(async (req, res) => {
  const { name, email, password, role, schoolId } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Missing required fields");
  }
  if (!["teacher", "principal"].includes(role)) {
    res.status(400);
    throw new Error("Role must be teacher or principal");
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    password,
    role,
    schoolId: schoolId || null,
    approved: true,
    createdBy: req.user._id,
  });

  // if principal, assign to school
  if (role === "principal" && schoolId) {
    const school = await School.findById(schoolId);
    if (school) {
      school.principal = user._id;
      await school.save();
    }
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
  });
});

/* =========================================================
   5️⃣ GET USERS (OPTIONAL ROLE FILTER)
   ========================================================= */
export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter)
    .select("-password")
    .populate("schoolId", "schoolName");
  res.json(users);
});

/* =========================================================
   6️⃣ TRANSFER PRINCIPAL/TEACHER
   ========================================================= */
export const transferUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { toSchoolId } = req.body;
  const userToTransfer = await User.findById(userId);
  if (!userToTransfer) {
    res.status(404);
    throw new Error("User not found");
  }
  if (!["principal", "teacher"].includes(userToTransfer.role)) {
    res.status(400);
    throw new Error("Only principal or teacher can be transferred");
  }

  userToTransfer.schoolId = toSchoolId;
  await userToTransfer.save();

  // if principal, update school's principal pointer
  if (userToTransfer.role === "principal") {
    await School.updateMany(
      { principal: userToTransfer._id },
      { $unset: { principal: "" } }
    );
    if (toSchoolId) {
      const toSchool = await School.findById(toSchoolId);
      if (toSchool) {
        toSchool.principal = userToTransfer._id;
        await toSchool.save();
      }
    }
  }

  res.json({ message: "User transferred", user: userToTransfer });
});
