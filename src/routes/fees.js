/**
 * Express REST API Routes for Fees
 */

const express = require('express');
const router = express.Router();

const { getAllProtocols, getProtocolById, calculateDefiFee } = require('../services/defiService');
const { getAllBridges, getAvailableBridges, calculateBridgeFee } = require('../services/bridgeService');
const { getGasMetrics, compareFeeRoutes } = require('../services/feeCalculator');

/**
 * GET /api/v1/fees/gas
 * Returns gas metrics across supported networks.
 */
router.get('/gas', (req, res, next) => {
  try {
    const { chain } = req.query;
    const metrics = getGasMetrics(chain);
    res.json({ success: true, data: metrics });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

/**
 * GET /api/v1/fees/defi
 * Returns list of DeFi protocols or fee details for a specific protocol.
 */
router.get('/defi', (req, res, next) => {
  try {
    const { protocol, amountUsd } = req.query;

    if (protocol) {
      const amount = parseFloat(amountUsd || 1000);
      const calculation = calculateDefiFee(protocol, amount);
      return res.json({ success: true, data: calculation });
    }

    const protocols = getAllProtocols();
    res.json({ success: true, count: protocols.length, data: protocols });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

/**
 * GET /api/v1/fees/bridges
 * Returns available cross-chain bridges.
 */
router.get('/bridges', (req, res, next) => {
  try {
    const { sourceChain, destinationChain, token, amountUsd } = req.query;

    if (sourceChain && destinationChain) {
      const bridges = getAvailableBridges(sourceChain, destinationChain, token);

      if (amountUsd) {
        const numAmount = parseFloat(amountUsd);
        const calculated = bridges.map((b) =>
          calculateBridgeFee(b.id, numAmount, sourceChain, destinationChain)
        );
        return res.json({ success: true, count: calculated.length, data: calculated });
      }

      return res.json({ success: true, count: bridges.length, data: bridges });
    }

    const allBridges = getAllBridges();
    res.json({ success: true, count: allBridges.length, data: allBridges });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

/**
 * POST /api/v1/fees/compare
 * Compares fee routes (Bridges or DEXs) for a requested transfer/swap.
 */
router.post('/compare', (req, res, next) => {
  try {
    const { sourceChain, destinationChain, token, amountUsd, maxBridgeTimeMinutes } = req.body;

    const result = compareFeeRoutes({
      sourceChain,
      destinationChain,
      token,
      amountUsd,
      maxBridgeTimeMinutes
    });

    res.json({ success: true, data: result });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
});

module.exports = router;
