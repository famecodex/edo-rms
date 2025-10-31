// backend/models/studentModel.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String },
    dateOfBirth: { type: Date },
    currentClass: { type: String, required: true },
    session: { type: String },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional link to student user
    status: { type: String, enum: ["active", "pending", "transfer_pending"], default: "active" },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
