// backend/models/gradeModel.js
import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    subject: { type: String, required: true },
    score: { type: Number, required: true },
    examType: { type: String }, // e.g., "midterm", "final"
  },
  { timestamps: true }
);

// unique index per student/subject/examType/teacher optional if desired
gradeSchema.index({ studentId: 1, subject: 1, examType: 1 }, { unique: false });

const Grade = mongoose.model("Grade", gradeSchema);
export default Grade;
