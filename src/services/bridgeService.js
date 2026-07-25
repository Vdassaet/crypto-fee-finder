/**
 * Cross-Chain Bridges Fee Service
 * Details protocol fees, fixed relayer costs, and latency metrics across chains.
 */

const CROSS_CHAIN_BRIDGES = [
  {
    id: 'stargate',
    name: 'Stargate (LayerZero)',
    supportedTokens: ['USDC', 'USDT', 'ETH'],
    feeType: 'Percentage + Destination Gas',
    percentageFee: 0.0006, // 0.06%
    fixedRelayerFeeUsd: 1.20,
    averageTimeMinutes: 3,
    chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche']
  },
  {
    id: 'hop',
    name: 'Hop Protocol',
    supportedTokens: ['ETH', 'USDC', 'USDT', 'MATIC'],
    feeType: 'Percentage + Bonder Fee',
    percentageFee: 0.0004, // 0.04%
    fixedRelayerFeeUsd: 0.80,
    averageTimeMinutes: 5,
    chains: ['ethereum', 'arbitrum', 'optimism', 'polygon']
  },
  {
    id: 'synapse',
    name: 'Synapse Protocol',
    supportedTokens: ['USDC', 'USDT', 'ETH', 'WBTC'],
    feeType: 'Percentage + Swap Fee',
    percentageFee: 0.0005, // 0.05%
    fixedRelayerFeeUsd: 1.50,
    averageTimeMinutes: 4,
    chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche']
  },
  {
    id: 'arbitrum_native',
    name: 'Arbitrum Canonical Bridge',
    supportedTokens: ['ETH', 'USDC', 'USDT'],
    feeType: 'Gas Only (L1 -> L2 fast, L2 -> L1 7-day challenge period)',
    percentageFee: 0.0000,
    fixedRelayerFeeUsd: 0.00,
    averageTimeMinutes: 15, // L1 -> L2
    chains: ['ethereum', 'arbitrum']
  },
  {
    id: 'polygon_native',
    name: 'Polygon PoS Bridge',
    supportedTokens: ['ETH', 'USDC', 'USDT', 'MATIC'],
    feeType: 'Gas Only',
    percentageFee: 0.0000,
    fixedRelayerFeeUsd: 0.00,
    averageTimeMinutes: 20,
    chains: ['ethereum', 'polygon']
  },
  {
    id: 'wormhole',
    name: 'Wormhole Portal',
    supportedTokens: ['USDC', 'ETH', 'SOL', 'USDT'],
    feeType: 'Fixed Relayer + Gas',
    percentageFee: 0.0003, // 0.03%
    fixedRelayerFeeUsd: 0.50,
    averageTimeMinutes: 2,
    chains: ['ethereum', 'solana', 'arbitrum', 'polygon', 'bsc']
  }
];

/**
 * Get list of all supported bridges
 */
function getAllBridges() {
  return CROSS_CHAIN_BRIDGES;
}

/**
 * Find valid bridge routes for source chain and destination chain
 */
function getAvailableBridges(sourceChain, destinationChain, token = null) {
  const src = sourceChain.toLowerCase();
  const dst = destinationChain.toLowerCase();

  return CROSS_CHAIN_BRIDGES.filter((bridge) => {
    const supportsChains = bridge.chains.includes(src) && bridge.chains.includes(dst);
    const supportsToken = !token || bridge.supportedTokens.includes(token.toUpperCase());
    return supportsChains && supportsToken;
  });
}

/**
 * Calculate bridge fee for a given route and transfer amount
 */
function calculateBridgeFee(bridgeId, amountUsd, sourceChain, destinationChain) {
  const bridge = CROSS_CHAIN_BRIDGES.find((b) => b.id === bridgeId);
  if (!bridge) {
    throw new Error(`Bridge '${bridgeId}' not found`);
  }

  const variableFeeUsd = amountUsd * bridge.percentageFee;
  const totalBridgeFeeUsd = variableFeeUsd + bridge.fixedRelayerFeeUsd;

  return {
    bridgeId: bridge.id,
    bridgeName: bridge.name,
    sourceChain,
    destinationChain,
    amountUsd,
    percentageFeeRate: bridge.percentageFee,
    variableFeeUsd: parseFloat(variableFeeUsd.toFixed(4)),
    fixedRelayerFeeUsd: bridge.fixedRelayerFeeUsd,
    totalBridgeFeeUsd: parseFloat(totalBridgeFeeUsd.toFixed(4)),
    averageTimeMinutes: bridge.averageTimeMinutes,
    netAmountUsd: parseFloat((amountUsd - totalBridgeFeeUsd).toFixed(4))
  };
}

module.exports = {
  CROSS_CHAIN_BRIDGES,
  getAllBridges,
  getAvailableBridges,
  calculateBridgeFee
};
