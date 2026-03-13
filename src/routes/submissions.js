const express = require('express');

const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createSubmissionSchema } = require('../validators/submissions');

const router = express.Router();

router.use(authRequired);

router.post('/', requireRole('student'), validateBody(createSubmissionSchema), async (req, res, next) => {
  try {
    const { assignmentId, answerText } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.status !== 'Published') {
      const err = new Error('Assignment not available for submission');
      err.status = 400;
      throw err;
    }

    if (assignment.dueDate && new Date() > assignment.dueDate) {
      const err = new Error('Assignment due date has passed');
      err.status = 400;
      throw err;
    }

    const existing = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (existing) {
      const err = new Error('You have already submitted an answer for this assignment');
      err.status = 400;
      throw err;
    }

    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      answerText,
      submittedAt: new Date(),
    });

    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', requireRole('student'), async (req, res, next) => {
  try {
    const filter = { student: req.user._id };
    if (req.query.assignmentId) {
      filter.assignment = req.query.assignmentId;
    }

    const submissions = await Submission.find(filter)
      .populate('assignment', 'title status dueDate')
      .sort({ submittedAt: -1 });

    res.json({ items: submissions });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/review', requireRole('teacher'), async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('assignment');
    if (!submission) {
      const err = new Error('Submission not found');
      err.status = 404;
      throw err;
    }

    if (String(submission.assignment.createdBy) !== String(req.user._id)) {
      const err = new Error('Submission not found');
      err.status = 404;
      throw err;
    }

    submission.reviewedAt = new Date();
    submission.reviewedBy = req.user._id;
    await submission.save();

    res.json(submission);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
