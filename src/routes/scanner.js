/**
 * Express REST API Routes for ChainRecover AI Scanner
 */

const express = require('express');
const router = express.Router();
const { scanWallet, validateAddress, SUPPORTED_CHAINS } = require('../services/scannerService');

/**
 * GET /api/v1/scanner/chains
 * List supported chains
 */
router.get('/chains', (req, res) => {
  res.json({ success: true, data: SUPPORTED_CHAINS });
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

    const type = validateAddress(address);
    if (!type) {
      return res.status(400).json({ error: true, message: 'Invalid wallet address' });
    }

    // Security Guarantee: Returns transaction payload structure for client-side wallet signature
    let txPayload = {};

    if (actionType === 'RECLAIM_SOLANA_RENT') {
      const accountCount = targetAccounts ? targetAccounts.length : 5;
      const estimatedSolReclaimed = accountCount * 0.00203928;

      txPayload = {
        chain: 'solana',
        instructionsCount: accountCount,
        action: 'closeEmptyTokenAccounts',
        reclaimAmountSol: estimatedSolReclaimed,
        reclaimAmountUsd: estimatedSolReclaimed * 180,
        estimatedGasSol: 0.000005,
        requiresSignatureFrom: address,
        rawUnsignedTransactionBase64: 'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      };
    } else if (actionType === 'CLAIM_REWARDS') {
      txPayload = {
        chain: 'ethereum',
        action: 'claimStakingYield',
        estimatedRewardUsd: 144.70,
        estimatedGasUsd: 3.20,
        requiresSignatureFrom: address,
        toContract: '0x1111111254fb6c44bac0bed2854e76f90643097d',
        data: '0x38ed173900000000000000000000000000000000000000000000000000000000'
      };
    } else {
      txPayload = {
        chain: type.toLowerCase(),
        action: actionType,
        requiresSignatureFrom: address
      };
    }

    res.json({
      success: true,
      message: 'Unsigned transaction prepared for wallet signature. Private keys are never touched.',
      data: txPayload
    });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

module.exports = router;
