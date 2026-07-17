const express = require('express');

const router = express.Router();

// Auth and expense routes mount here in later phases
router.get('/', (_req, res) => {
  res.json({
    message: 'Spentra API',
    version: '1.0.0',
    base: '/api',
  });
});

module.exports = router;
