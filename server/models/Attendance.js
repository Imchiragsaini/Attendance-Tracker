const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    // Stored as 'YYYY-MM-DD' text, not a Date, so timezones can never shift a day.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, enum: ['present', 'absent', 'holiday'], required: true },
    // 'self' = marked by the student. Phase 2 adds 'teacher' with no migration.
    source: { type: String, enum: ['self', 'teacher'], default: 'self' },
  },
  { timestamps: true }
);

// One record per student/subject/day/source, so re-marking updates instead of duplicating
attendanceSchema.index({ student: 1, subject: 1, date: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
