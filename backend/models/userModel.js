// backend/models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    role: {
      type: String,
      enum: ["ministry", "principal", "teacher", "student"],
      required: [true, "User role is required"],
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null, // null for ministry-level users
    },

    approved: {
      type: Boolean,
      default: function () {
        return this.role !== "student"; // students require ministry approval
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    transferPending: {
      type: Boolean,
      default: false, // For pending transfer requests
    },
  },
  { timestamps: true }
);

// 🔒 Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔐 Compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🧠 Virtual for quick role check
userSchema.virtual("isMinistry").get(function () {
  return this.role === "ministry";
});

userSchema.virtual("isPrincipal").get(function () {
  return this.role === "principal";
});

userSchema.virtual("isTeacher").get(function () {
  return this.role === "teacher";
});

userSchema.virtual("isStudent").get(function () {
  return this.role === "student";
});

const User = mongoose.model("User", userSchema);
export default User;
