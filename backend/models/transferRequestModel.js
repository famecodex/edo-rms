// backend/models/transferRequestModel.js
import mongoose from "mongoose";

const transferRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromSchool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    toSchool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },

    // Snapshot of student's class at time of request
    studentClass: { type: String, default: null },

    // Principal approval stage
    principalApproved: {
      type: Boolean,
      default: null, // null = pending
    },

    // Ministry approval stage
    ministryApproved: {
      type: Boolean,
      default: null,
    },

    // Human-readable progress status
    status: {
      type: String,
      enum: [
        "pending",                // student just requested
        "principal_approved",     // approved by principal (awaiting ministry)
        "principal_rejected",     // rejected by principal
        "ministry_approved",      // approved by ministry and awaiting destination acceptance
        "ministry_rejected",      // rejected by ministry
        "destination_accepted",   // accepted by receiving principal (final)
        "destination_rejected"    // receiving principal rejected
      ],
      default: "pending",
    },

    // Destination principal acceptance metadata
    destinationAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    destinationAcceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const TransferRequest = mongoose.model("TransferRequest", transferRequestSchema);
export default TransferRequest;
