const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const apiRoutes = require('./routes');
const setupSwagger = require('./config/swaggerSetup');

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());

setupSwagger(app);

app.get('/', (_req, res) => {
  res.json({
    message: 'Spentra API is running',
    docs: '/api-docs',
    openapi: '/api-docs.json',
  });
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
