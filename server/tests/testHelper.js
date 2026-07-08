const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const generateTestToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890',
    { expiresIn: '1h' }
  );
};

const setupTestDB = () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm-db-test';
    // Ensure we avoid connecting to the main dev db if possible
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  // Keeping connection open across test suites to prevent reconnection hangs.
  // Jest's process teardown handles final cleanup.
};

module.exports = {
  setupTestDB,
  generateTestToken
};
