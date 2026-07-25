/**
 * ChainRecover AI & Crypto Fee Finder API Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const feesRouter = require('./routes/fees');
const scannerRouter = require('./routes/scanner');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Serve static frontend assets for ChainRecover AI web app
app.use(express.static(path.join(__dirname, '../public')));

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

// API Routes
app.use('/api/v1/fees', feesRouter);
app.use('/api/v1/scanner', scannerRouter);

// Fallback to index.html for Web App SPA
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 ChainRecover AI SaaS Platform running at http://localhost:${PORT}`);
    console.log(`📚 OpenAPI Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
