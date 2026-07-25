/**
 * Express REST API Routes for ChainRecover AI Scanner & Module 2 Solana Rent Recovery
 */

const express = require('express');
const router = express.Router();
const { scanWallet, validateAddress, SUPPORTED_CHAINS } = require('../services/scannerService');
const {
  findEmptyTokenAccounts,
  buildCloseAccountTransaction
} = require('../services/solanaRentService');

/**
 * GET /api/v1/scanner/chains
 * List supported chains
 */
router.get('/chains', (req, res) => {
  res.json({ success: true, data: SUPPORTED_CHAINS });
});

/**
 * MODULE 2: GET /api/v1/scanner/solana/rent/:address
 * Detect empty SPL Token Accounts & closable ATAs with exact rent metrics
 */
router.get('/solana/rent/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const rentSummary = await findEmptyTokenAccounts(address);
    res.json({ success: true, data: rentSummary });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

/**
 * MODULE 2: POST /api/v1/scanner/solana/build-close-tx
 * Generate close account instructions & base64 transaction payload for 1-click recovery
 */
router.post('/solana/build-close-tx', (req, res, next) => {
  try {
    const { walletAddress, accountAddresses } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: true, message: 'walletAddress parameter is required' });
    }

    const result = buildCloseAccountTransaction(walletAddress, accountAddresses || []);
    res.json({ success: true, data: result });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

/**
 * GET /api/v1/scanner/wallet/:address
 * Deep scan wallet across all supported chains
 */
router.get('/wallet/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const result = await scanWallet(address);
    res.json({ success: true, data: result });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

/**
 * POST /api/v1/scanner/recover
 * Generate unsigned recovery transaction payload for user wallet approval
 */
router.post('/recover', (req, res, next) => {
  try {
    const { address, actionType, targetAccounts } = req.body;

    if (!address || !actionType) {
      return res.status(400).json({ error: true, message: 'address and actionType are required' });
    }

    if (actionType === 'RECLAIM_SOLANA_RENT') {
      const result = buildCloseAccountTransaction(address, targetAccounts || []);
      return res.json({
        success: true,
        message: 'Unsigned Solana close-account transaction prepared for wallet signature.',
        data: result
      });
    }

    res.json({
      success: true,
      message: 'Unsigned transaction prepared for wallet signature. Private keys are never touched.',
      data: {
        chain: 'ethereum',
        action: actionType,
        requiresSignatureFrom: address
      }
    });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

module.exports = router;
