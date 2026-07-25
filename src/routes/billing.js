/**
 * ChainRecover AI - SaaS Billing & Monetization Express Router
 */

const express = require('express');
const router = express.Router();
const {
  SAAS_TIERS,
  checkUserScanQuota,
  calculateRecoveryCommission
} = require('../services/billingService');

/**
 * GET /api/v1/billing/tiers
 */
router.get('/tiers', (req, res) => {
  res.json({ success: true, data: SAAS_TIERS });
});

/**
 * POST /api/v1/billing/verify-quota
 */
router.post('/verify-quota', (req, res) => {
  const { walletAddress, userTier } = req.body;
  const quotaResult = checkUserScanQuota(walletAddress, userTier || 'FREE');
  res.json({ success: true, data: quotaResult });
});

/**
 * POST /api/v1/billing/subscribe
 */
router.post('/subscribe', (req, res) => {
  const { walletAddress, targetTier } = req.body;
  if (!walletAddress || !targetTier) {
    return res.status(400).json({ error: true, message: 'walletAddress and targetTier are required' });
  }

  const selectedTier = SAAS_TIERS[targetTier];
  if (!selectedTier) {
    return res.status(400).json({ error: true, message: `Invalid tier '${targetTier}'` });
  }

  res.json({
    success: true,
    message: `Subscription payload created for ${selectedTier.name}.`,
    data: {
      walletAddress,
      tier: selectedTier,
      billingCycle: 'Monthly',
      requiresSignatureFrom: walletAddress
    }
  });
});

/**
 * POST /api/v1/billing/calculate-commission
 */
router.post('/calculate-commission', (req, res) => {
  const { recoveredAmountUsd } = req.body;
  const commissionReport = calculateRecoveryCommission(recoveredAmountUsd);
  res.json({ success: true, data: commissionReport });
});

module.exports = router;
