const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const apiRoutes = require('./routes');

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Spentra API is running', docs: '/api' });
});

app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
