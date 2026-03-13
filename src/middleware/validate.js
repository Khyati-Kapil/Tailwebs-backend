const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.map((e) => e.message).join(', ') || 'Invalid input';
    const error = new Error(message);
    error.status = 400;
    next(error);
  }
};

module.exports = { validateBody };
