const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { validateBody } = require('../middleware/validate');
const { loginSchema } = require('../validators/auth');

const router = express.Router();

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
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
