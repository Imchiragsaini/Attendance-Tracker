const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    // Owner of this subject in phase 1. In phase 2 a teacher-created subject
    // can be linked to a student's personal subject via `officialSubject`.
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, trim: true, maxlength: 20, default: '' },
    // Minimum attendance percentage the college requires (50 = debar line)
    threshold: { type: Number, min: 0, max: 100, default: 50 },
    color: { type: String, default: '#4f46e5' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
