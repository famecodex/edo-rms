// backend/models/transferModel.js
import mongoose from "mongoose";

const transferSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    fromSchoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    toSchoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    reason: { type: String, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // student user or principal
    principalApproved: { type: Boolean, default: false },
    ministryApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["requested", "principal_approved", "ministry_approved", "rejected", "completed"],
      default: "requested",
    },
  },
  { timestamps: true }
);

const Transfer = mongoose.model("Transfer", transferSchema);
export default Transfer;
