const jwt = require('jsonwebtoken');
const config = require('../config/env');

function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' });
}

module.exports = generateToken;
