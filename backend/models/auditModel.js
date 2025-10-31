// backend/models/auditModel.js
import mongoose from 'mongoose';

const auditSchema = mongoose.Schema({
  action: { type: String, required: true }, // e.g. CREATE_GRADE, UPDATE_USER
  collection: { type: String }, // model name
  documentId: { type: mongoose.Schema.Types.ObjectId },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedAt: { type: Date, default: Date.now },
  changes: { type: Object }, // optional: what changed
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditSchema);
export default AuditLog;
