const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { protect };
