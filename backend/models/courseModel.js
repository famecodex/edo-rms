// backend/models/courseModel.js
import mongoose from 'mongoose';

const courseSchema = mongoose.Schema({
  courseCode: { type: String, required: true, unique: true }, // e.g. MTH-JSS1
  title: { type: String, required: true },
  level: { type: String }, // e.g. JSS1, SSS3
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;
