const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_change_in_prod', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = { generateToken };
