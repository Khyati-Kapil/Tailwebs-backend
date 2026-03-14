const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { validateBody } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/auth');

const router = express.Router();

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const err = new Error('JWT_SECRET is not set');
      err.status = 500;
      throw err;
    }

    const token = jwt.sign(
      { role: user.role, name: user.name },
      secret,
      { subject: String(user._id), expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const err = new Error('JWT_SECRET is not set');
      err.status = 500;
      throw err;
    }

    const token = jwt.sign(
      { role: user.role, name: user.name },
      secret,
      { subject: String(user._id), expiresIn: '7d' }
    );

    res.json({
      token,
      role: user.role,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
