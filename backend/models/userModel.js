// backend/models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email address"
      }
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: function(v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v);
        },
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      }
    },

    role: {
      type: String,
      enum: {
        values: ["ministry", "principal", "teacher", "student"],
        message: "{VALUE} is not a valid role"
      },
      required: [true, "User role is required"]
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
      validate: {
        validator: function(v) {
          return this.role === "ministry" || v != null;
        },
        message: "School ID is required for non-ministry users"
      }
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      validate: {
        validator: function(v) {
          return this.role !== "teacher" || v != null;
        },
        message: "Course ID is required for teachers"
      }
    },

    approved: {
      type: Boolean,
      default: function () {
        return this.role !== "student";
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    transferPending: {
      type: Boolean,
      default: false
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    lastPasswordChange: {
      type: Date,
      default: Date.now
    },

    passwordHistory: [{
      password: String,
      changedAt: {
        type: Date,
        default: Date.now
      }
    }],

    loginAttempts: {
      type: Number,
      default: 0
    },

    lockoutUntil: {
      type: Date,
      default: null
    },

    lastLogin: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    },
  },
  { timestamps: true }
);

// 🔒 Hash password before save
userSchema.pre("save", async function (next) {
  // Only hash if password is modified or new
  if (!this.isModified("password")) return next();

  try {
    // Generate strong salt and hash
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Add to password history if it's a password change (not new user)
    if (this.isModified("password") && !this.isNew) {
      this.passwordHistory.push({ 
        password: this.password,
        changedAt: Date.now()
      });
      
      // Keep only last 5 passwords
      if (this.passwordHistory.length > 5) {
        this.passwordHistory.shift();
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Compare password with a rate limiter
userSchema.methods.matchPassword = async function(enteredPassword) {
  // Check if account is locked
  if (this.isLocked()) {
    throw new Error("Account is temporarily locked. Please try again later.");
  }

  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    
    if (!isMatch) {
      // Increment login attempts
      await this.incrementLoginAttempts();
      return false;
    }

    // Reset login attempts on successful login
    await this.resetLoginAttempts();
    return true;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

// Check if password is in history
userSchema.methods.isPasswordInHistory = async function(newPassword) {
  for (const historyEntry of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, historyEntry.password)) {
      return true;
    }
  }
  return false;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockoutUntil && this.lockoutUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Increment attempts
  this.loginAttempts += 1;

  // Lock account if max attempts reached (5 attempts)
  if (this.loginAttempts >= 5) {
    this.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
  }

  await this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockoutUntil = null;
  this.lastLogin = Date.now();
  await this.save();
};

// 🧠 Virtual helpers
userSchema.virtual("isMinistry").get(function () {
  return this.role === "ministry";
});

userSchema.virtual("isPrincipal").get(function () {
  return this.role === "principal";
});

userSchema.virtual("isTeacher").get(function () {
  return this.role === "teacher";
});

userSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

userSchema.virtual("isStudent").get(function () {
  return this.role === "student";
});

const User = mongoose.model("User", userSchema);
export default User;
