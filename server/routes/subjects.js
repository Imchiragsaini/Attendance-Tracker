const express = require('express');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { requireAuth } = require('../middleware/auth');
const { computeStats } = require('../utils/stats');

const router = express.Router();
router.use(requireAuth);

// Counts present/absent for one subject (self-marked only in phase 1)
async function statsForSubject(studentId, subject, source = 'self') {
  const rows = await Attendance.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        subject: subject._id,
        source,
      },
    },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return computeStats({
    present: counts.present || 0,
    absent: counts.absent || 0,
    threshold: subject.threshold,
  });
}

function validateThreshold(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 100 ? n : null;
}

// GET /api/subjects  -> every subject with its stats
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ student: req.user.id }).sort({ createdAt: 1 });
    const withStats = await Promise.all(
      subjects.map(async (s) => ({ ...s.toObject(), stats: await statsForSubject(req.user.id, s) }))
    );
    res.json({ subjects: withStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load subjects' });
  }
});

// POST /api/subjects
router.post('/', async (req, res) => {
  try {
    const { name, code, threshold, color } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Subject name is required' });

    const t = threshold === undefined ? 50 : validateThreshold(threshold);
    if (t === null) return res.status(400).json({ message: 'Threshold must be a whole number from 0 to 100' });

    const subject = await Subject.create({ student: req.user.id, name, code, threshold: t, color });
    res.status(201).json({ subject: { ...subject.toObject(), stats: computeStats({ threshold: t }) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create subject' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Subject not found' });
    const subject = await Subject.findOne({ _id: req.params.id, student: req.user.id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const { name, code, threshold, color } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ message: 'Subject name cannot be empty' });
      subject.name = name;
    }
    if (code !== undefined) subject.code = code;
    if (color !== undefined) subject.color = color;
    if (threshold !== undefined) {
      const t = validateThreshold(threshold);
      if (t === null) return res.status(400).json({ message: 'Threshold must be a whole number from 0 to 100' });
      subject.threshold = t;
    }
    await subject.save();

    res.json({ subject: { ...subject.toObject(), stats: await statsForSubject(req.user.id, subject) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update subject' });
  }
});

// DELETE /api/subjects/:id  (also removes its attendance records)
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Subject not found' });
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, student: req.user.id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    await Attendance.deleteMany({ subject: subject._id, student: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete subject' });
  }
});

module.exports = router;
module.exports.statsForSubject = statsForSubject;
