const express = require('express');

const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
  createAssignmentSchema,
  updateAssignmentSchema,
  statusTransitionSchema,
} = require('../validators/assignments');

const router = express.Router();

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req);

    let filter = {};
    if (req.user.role === 'teacher') {
      if (req.query.status) {
        filter.status = req.query.status;
      }
      filter.createdBy = req.user._id;
    } else {
      filter.status = 'Published';
    }

    const [items, total] = await Promise.all([
      Assignment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (req.user.role === 'student' && assignment.status !== 'Published') {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (req.user.role === 'teacher' && String(assignment.createdBy) !== String(req.user._id)) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('teacher'), validateBody(createAssignmentSchema), async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      dueDate: new Date(dueDate),
      createdBy: req.user._id,
    });

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('teacher'), validateBody(updateAssignmentSchema), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (String(assignment.createdBy) !== String(req.user._id)) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (assignment.status !== 'Draft') {
      const err = new Error('Only Draft assignments can be edited');
      err.status = 400;
      throw err;
    }

    if (req.body.title) assignment.title = req.body.title;
    if (req.body.description) assignment.description = req.body.description;
    if (req.body.dueDate) assignment.dueDate = new Date(req.body.dueDate);

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (String(assignment.createdBy) !== String(req.user._id)) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (assignment.status !== 'Draft') {
      const err = new Error('Only Draft assignments can be deleted');
      err.status = 400;
      throw err;
    }

    await assignment.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/status', requireRole('teacher'), validateBody(statusTransitionSchema), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (String(assignment.createdBy) !== String(req.user._id)) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    const nextStatus = req.body.status;
    const current = assignment.status;

    const transitions = {
      Draft: 'Published',
      Published: 'Completed',
      Completed: null,
    };

    if (transitions[current] !== nextStatus) {
      const err = new Error(`Invalid status transition from ${current} to ${nextStatus}`);
      err.status = 400;
      throw err;
    }

    assignment.status = nextStatus;
    if (nextStatus === 'Published') assignment.publishedAt = new Date();
    if (nextStatus === 'Completed') assignment.completedAt = new Date();

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/submissions', requireRole('teacher'), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    if (String(assignment.createdBy) !== String(req.user._id)) {
      const err = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({ items: submissions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
