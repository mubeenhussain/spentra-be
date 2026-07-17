const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    message: 'Spentra API',
    version: '1.0.0',
    base: '/api',
  });
});

router.use('/auth', authRoutes);

module.exports = router;
