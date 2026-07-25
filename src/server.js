/**
 * Crypto Fee Finder API Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const feesRouter = require('./routes/fees');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Swagger UI OpenAPI documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('Swagger specification loading skipped:', err.message);
}

// Base Route & Health Check
app.get('/', (req, res) => {
  res.json({
    name: 'Crypto Fee Finder API',
    version: '1.0.0',
    status: 'online',
    documentation: '/api-docs',
    endpoints: {
      gas: '/api/v1/fees/gas',
      defi: '/api/v1/fees/defi',
      bridges: '/api/v1/fees/bridges',
      compare: '/api/v1/fees/compare [POST]'
    }
  });
});

// API Routes
app.use('/api/v1/fees', feesRouter);

// Global Error Handler
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Crypto Fee Finder API running at http://localhost:${PORT}`);
    console.log(`📚 OpenAPI Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
