const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authRequired = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      const err = new Error('JWT_SECRET is not set');
      err.status = 500;
      throw err;
    }

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('_id name email role');
    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    if (!err.status) {
      err.status = 401;
      err.message = 'Invalid or expired token';
    }
    next(err);
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.status = 401;
    return next(err);
  }
  if (req.user.role !== role) {
    const err = new Error('Forbidden');
    err.status = 403;
    return next(err);
  }
  return next();
};

module.exports = { authRequired, requireRole };
