/**
 * ChainRecover AI - Express Rate Limiter Middleware
 * Protects RPC nodes, API endpoints, and prevents DDoS attacks.
 */

const rateLimit = require('express-rate-limit');

/**
 * Scanner Rate Limiter: Max 60 requests per 15-minute window per IP
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Rate limit exceeded: Too many requests from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Strict Recovery Rate Limiter: Max 20 requests per 15-minute window per IP
 */
const recoveryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Recovery execution rate limit exceeded. Please try again later.'
  }
});

module.exports = {
  apiRateLimiter,
  recoveryRateLimiter
};
