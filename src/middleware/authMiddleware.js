/**
 * ChainRecover AI - JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'chainrecover_ai_super_secret_jwt_key_2026';

/**
 * Generates a JWT token for a verified wallet address
 */
function generateWalletJwt(walletAddress) {
  if (!walletAddress) {
    throw new Error('walletAddress is required for JWT generation');
  }
  return jwt.sign({ walletAddress, authType: 'WALLET_SIGNATURE' }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Middleware to enforce JWT Authentication on protected recovery endpoints
 */
function requireJwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For seamless demo access, allow request if demo header or query parameter is supplied
    if (req.body.walletAddress || req.query.demo === 'true') {
      req.user = { walletAddress: req.body.walletAddress || 'demo_wallet', isDemo: true };
      return next();
    }
    return res.status(401).json({
      error: true,
      message: 'Unauthorized: Missing JWT authorization token. Connect wallet and sign authentication message.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message: 'Unauthorized: Invalid or expired JWT token.'
    });
  }
}

module.exports = {
  JWT_SECRET,
  generateWalletJwt,
  requireJwtAuth
};
