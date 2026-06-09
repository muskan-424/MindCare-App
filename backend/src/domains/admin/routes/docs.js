/**
 * API documentation routes — Swagger UI + raw OpenAPI JSON.
 */
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { spec } = require('../../../openapi');

const router = express.Router();

router.get('/openapi.json', (_req, res) => {
  res.json(spec);
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(spec, {
  customSiteTitle: 'MindCare API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

module.exports = router;
