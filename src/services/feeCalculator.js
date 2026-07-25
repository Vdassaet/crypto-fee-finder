/**
 * Fee Calculator & Route Comparison Engine
 * Aggregates Gas costs, DEX fees, and Bridge fees across networks.
 */

const { getAvailableBridges, calculateBridgeFee } = require('./bridgeService');
const { getProtocolById, calculateDefiFee } = require('./defiService');

// Simulated Gas prices in Gwei and Native Token USD Prices
const CHAIN_GAS_METRICS = {
  ethereum: { gwei: 18, nativePriceUsd: 3200, nativeSymbol: 'ETH', transferGas: 21000 },
  arbitrum: { gwei: 0.1, nativePriceUsd: 3200, nativeSymbol: 'ETH', transferGas: 40000 },
  optimism: { gwei: 0.15, nativePriceUsd: 3200, nativeSymbol: 'ETH', transferGas: 35000 },
  polygon: { gwei: 45, nativePriceUsd: 0.70, nativeSymbol: 'POL', transferGas: 30000 },
  bsc: { gwei: 3, nativePriceUsd: 640, nativeSymbol: 'BNB', transferGas: 21000 },
  avalanche: { gwei: 25, nativePriceUsd: 35, nativeSymbol: 'AVAX', transferGas: 30000 },
  base: { gwei: 0.08, nativePriceUsd: 3200, nativeSymbol: 'ETH', transferGas: 35000 },
  solana: { lamports: 5000, nativePriceUsd: 180, nativeSymbol: 'SOL', transferGas: 1 }
};

/**
 * Get real-time gas price metrics for supported networks
 */
function getGasMetrics(chain = null) {
  if (chain) {
    const c = chain.toLowerCase();
    if (!CHAIN_GAS_METRICS[c]) {
      throw new Error(`Unsupported chain '${chain}'`);
    }
    return { chain: c, ...CHAIN_GAS_METRICS[c] };
  }
  return CHAIN_GAS_METRICS;
}

/**
 * Estimate gas cost in USD for a given chain and gas units consumed
 */
function estimateGasCostUsd(chain, gasUnits = 21000) {
  const c = chain.toLowerCase();
  const metrics = CHAIN_GAS_METRICS[c];
  if (!metrics) {
    return 1.0; // default fallback
  }

  if (c === 'solana') {
    // Fixed micro-lamport transaction fee on Solana (~$0.0009 USD)
    return 0.001;
  }

  // Cost in ETH/Native = (Gas Units * Gwei * 1e-9)
  const nativeCost = gasUnits * metrics.gwei * 1e-9;
  const usdCost = nativeCost * metrics.nativePriceUsd;

  return parseFloat(usdCost.toFixed(4));
}

/**
 * Compare all valid routes (Bridges + DEXs) for transferring/swapping tokens
 * between sourceChain and destinationChain for a specified USD amount.
 */
function compareFeeRoutes({
  sourceChain,
  destinationChain,
  token = 'USDC',
  amountUsd = 1000,
  maxBridgeTimeMinutes = null
}) {
  if (!sourceChain || !destinationChain) {
    throw new Error('sourceChain and destinationChain parameters are required');
  }

  const src = sourceChain.toLowerCase();
  const dst = destinationChain.toLowerCase();
  const numAmount = parseFloat(amountUsd);

  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('amountUsd must be a positive number');
  }

  const isCrossChain = src !== dst;
  const routes = [];

  // Gas costs for initiating and completing transaction
  const srcGasUsd = estimateGasCostUsd(src, isCrossChain ? 80000 : 21000);
  const dstGasUsd = isCrossChain ? estimateGasCostUsd(dst, 50000) : 0;

  if (isCrossChain) {
    // Find available cross-chain bridges
    const availableBridges = getAvailableBridges(src, dst, token);

    for (const bridge of availableBridges) {
      if (maxBridgeTimeMinutes && bridge.averageTimeMinutes > maxBridgeTimeMinutes) {
        continue; // filter by time limit
      }

      const bridgeFee = calculateBridgeFee(bridge.id, numAmount, src, dst);
      const totalCostUsd = parseFloat((bridgeFee.totalBridgeFeeUsd + srcGasUsd + dstGasUsd).toFixed(4));
      const netOutputUsd = parseFloat((numAmount - totalCostUsd).toFixed(4));

      routes.push({
        type: 'BRIDGE',
        routeId: `${bridge.id}_${src}_${dst}`,
        name: bridge.name,
        provider: bridge.id,
        sourceChain: src,
        destinationChain: dst,
        inputAmountUsd: numAmount,
        breakdown: {
          bridgeVariableFeeUsd: bridgeFee.variableFeeUsd,
          bridgeFixedFeeUsd: bridgeFee.fixedRelayerFeeUsd,
          sourceGasUsd: srcGasUsd,
          destinationGasUsd: dstGasUsd,
          slippageUsd: parseFloat((numAmount * 0.0005).toFixed(4)) // estimated 0.05% slippage
        },
        totalFeeUsd: totalCostUsd,
        feePercentage: `${((totalCostUsd / numAmount) * 100).toFixed(2)}%`,
        netOutputUsd: netOutputUsd > 0 ? netOutputUsd : 0,
        estimatedTimeMinutes: bridge.averageTimeMinutes
      });
    }
  } else {
    // Same-chain DEX Swaps comparison
    const dexList = ['uniswap_v3', 'uniswap_v2', 'pancakeswap_v3', 'curve'];

    for (const dexId of dexList) {
      const dex = getProtocolById(dexId);
      if (dex && dex.supportedChains.includes(src)) {
        const dexResult = calculateDefiFee(dexId, numAmount);
        const swapGasUsd = estimateGasCostUsd(src, dex.estimatedGasUnits);
        const totalCostUsd = parseFloat((dexResult.protocolFeeUsd + swapGasUsd).toFixed(4));
        const netOutputUsd = parseFloat((numAmount - totalCostUsd).toFixed(4));

        routes.push({
          type: 'SWAP',
          routeId: `${dexId}_${src}`,
          name: dex.name,
          provider: dex.id,
          sourceChain: src,
          destinationChain: dst,
          inputAmountUsd: numAmount,
          breakdown: {
            protocolFeeUsd: dexResult.protocolFeeUsd,
            networkGasUsd: swapGasUsd,
            slippageUsd: parseFloat((numAmount * 0.0003).toFixed(4))
          },
          totalFeeUsd: totalCostUsd,
          feePercentage: `${((totalCostUsd / numAmount) * 100).toFixed(2)}%`,
          netOutputUsd: netOutputUsd > 0 ? netOutputUsd : 0,
          estimatedTimeMinutes: 1
        });
      }
    }
  }

  // Sort routes by total fee ascending (cheapest route first)
  routes.sort((a, b) => a.totalFeeUsd - b.totalFeeUsd);

  return {
    query: {
      sourceChain: src,
      destinationChain: dst,
      token: token.toUpperCase(),
      amountUsd: numAmount,
      isCrossChain
    },
    totalRoutesFound: routes.length,
    bestRoute: routes[0] || null,
    routes
  };
}

module.exports = {
  getGasMetrics,
  estimateGasCostUsd,
  compareFeeRoutes
};
