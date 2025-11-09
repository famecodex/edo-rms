// backend/models/schoolModel.js
import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    schoolName: { type: String, required: true, trim: true },
    address: { type: String },
    principal: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // principal user id
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const School = mongoose.model("School", schoolSchema);
export default School;
