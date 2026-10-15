const express = require('express');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { requireAuth } = require('../middleware/auth');
const { statsForSubject } = require('./subjects');

const router = express.Router();
router.use(requireAuth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const STATUSES = ['present', 'absent', 'holiday'];

function isRealDate(str) {
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

async function ownedSubject(req, res, subjectId) {
  if (!mongoose.isValidObjectId(subjectId)) {
    res.status(404).json({ message: 'Subject not found' });
    return null;
  }
  const subject = await Subject.findOne({ _id: subjectId, student: req.user.id });
  if (!subject) res.status(404).json({ message: 'Subject not found' });
  return subject;
}

// GET /api/attendance/:subjectId?month=2026-10  -> records for one month
router.get('/:subjectId', async (req, res) => {
  try {
    const subject = await ownedSubject(req, res, req.params.subjectId);
    if (!subject) return res; // response already sent

    const { month } = req.query;
    const filter = { student: req.user.id, subject: subject._id, source: 'self' };
    if (month) {
      if (!MONTH_RE.test(month)) return res.status(400).json({ message: 'month must look like 2026-10' });
      // Dates are 'YYYY-MM-DD' strings, so a prefix match selects the month
      filter.date = { $regex: `^${month}-` };
    }

    const records = await Attendance.find(filter).select('date status -_id').sort({ date: 1 });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load attendance' });
  }
});

// PUT /api/attendance  { subjectId, date, status }  status: present | absent | holiday | none
router.put('/', async (req, res) => {
  try {
    const { subjectId, date, status } = req.body;
    if (!DATE_RE.test(date || '') || !isRealDate(date)) {
      return res.status(400).json({ message: 'date must be a real date like 2026-10-11' });
    }
    if (status !== 'none' && !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'status must be present, absent, holiday or none' });
    }

    const subject = await ownedSubject(req, res, subjectId);
    if (!subject) return res;

    const key = { student: req.user.id, subject: subject._id, date, source: 'self' };
    if (status === 'none') {
      await Attendance.deleteOne(key);
    } else {
      await Attendance.findOneAndUpdate(key, { $set: { status } }, { upsert: true, new: true });
    }

    // Return fresh stats so the UI updates without a second request
    res.json({ ok: true, stats: await statsForSubject(req.user.id, subject) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save attendance' });
  }
});

module.exports = router;
