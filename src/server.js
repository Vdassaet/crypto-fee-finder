/**
 * ChainRecover AI & Crypto Fee Finder API Server Entry Point
 * Enforces Security Architecture: Rate Limiting, JWT Auth, Pre-Execution Validation & Zero Private Key Policy.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const feesRouter = require('./routes/fees');
const scannerRouter = require('./routes/scanner');
const adminRouter = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const { apiRateLimiter } = require('./middleware/rateLimiter');
const { generateWalletJwt } = require('./middleware/authMiddleware');
const { assertNoPrivateKeysOrSeedPhrases } = require('./utils/cryptoSecurity');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Global Security Middleware: Assert Zero Private Keys / Seed Phrases
app.use((req, res, next) => {
  try {
    if (req.body) assertNoPrivateKeysOrSeedPhrases(req.body);
    if (req.query) assertNoPrivateKeysOrSeedPhrases(req.query);
    next();
  } catch (err) {
    res.status(400).json({ error: true, message: err.message });
  }
});

// Apply Rate Limiting to Scanner API
app.use('/api/v1/scanner', apiRateLimiter);

// Serve static frontend assets for ChainRecover AI web app & Admin Panel
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

// Authentication Endpoint: Issues JWT token upon non-custodial wallet connection
app.post('/api/v1/auth/wallet-login', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: true, message: 'walletAddress is required' });
  }
  const token = generateWalletJwt(walletAddress);
  res.json({
    success: true,
    message: 'JWT Token generated successfully via non-custodial wallet authentication.',
    token,
    walletAddress
  });
});

// API Routes
app.use('/api/v1/fees', feesRouter);
app.use('/api/v1/scanner', scannerRouter);
app.use('/api/v1/admin', adminRouter);

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
    console.log(`🔒 Admin Control Panel available at http://localhost:${PORT}/admin.html`);
    console.log(`📚 OpenAPI Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
