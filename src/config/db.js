const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error('MONGODB_URI is not set');
    err.status = 500;
    throw err;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: true,
  });
};

module.exports = connectDb;
