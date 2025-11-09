// backend/models/studentModel.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true, enum: ['male', 'female'] },
    dateOfBirth: { type: Date, required: true },
    currentClass: { 
      type: String, 
      required: true,
      enum: ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']
    },
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianEmail: { type: String, required: true },
    address: { type: String, required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    status: { 
      type: String, 
      enum: ["active", "pending", "transfer_pending", "inactive"], 
      default: "pending" 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional link to student user account
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
