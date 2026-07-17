const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

function setupSwagger(app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Spentra API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = setupSwagger;
