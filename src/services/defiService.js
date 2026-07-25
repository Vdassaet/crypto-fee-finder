/**
 * DeFi Protocols Fee Service
 * Supplies fee structures and gas estimates for DEX swaps and lending protocols.
 */

const DEFI_PROTOCOLS = {
  uniswap_v3: {
    id: 'uniswap_v3',
    name: 'Uniswap V3',
    type: 'DEX',
    supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'],
    feeTiers: [
      { tier: '0.01%', poolFee: 0.0001, description: 'Very stable pairs (USDC/USDT)' },
      { tier: '0.05%', poolFee: 0.0005, description: 'Stable pairs (USDC/ETH)' },
      { tier: '0.30%', poolFee: 0.003, description: 'Standard pairs (ETH/BTC)' },
      { tier: '1.00%', poolFee: 0.01, description: 'Exotic pairs' }
    ],
    defaultFeeRate: 0.0005,
    estimatedGasUnits: 150000
  },
  uniswap_v2: {
    id: 'uniswap_v2',
    name: 'Uniswap V2',
    type: 'DEX',
    supportedChains: ['ethereum'],
    feeTiers: [
      { tier: '0.30%', poolFee: 0.003, description: 'Flat 0.3% protocol fee' }
    ],
    defaultFeeRate: 0.003,
    estimatedGasUnits: 110000
  },
  pancakeswap_v3: {
    id: 'pancakeswap_v3',
    name: 'PancakeSwap V3',
    type: 'DEX',
    supportedChains: ['bsc', 'ethereum', 'arbitrum'],
    feeTiers: [
      { tier: '0.01%', poolFee: 0.0001 },
      { tier: '0.05%', poolFee: 0.0005 },
      { tier: '0.25%', poolFee: 0.0025 }
    ],
    defaultFeeRate: 0.0025,
    estimatedGasUnits: 140000
  },
  curve: {
    id: 'curve',
    name: 'Curve Finance',
    type: 'DEX Stableswap',
    supportedChains: ['ethereum', 'arbitrum', 'polygon', 'optimism'],
    feeTiers: [
      { tier: '0.04%', poolFee: 0.0004, description: 'Stableswap standard pool fee' }
    ],
    defaultFeeRate: 0.0004,
    estimatedGasUnits: 220000
  },
  aave_v3: {
    id: 'aave_v3',
    name: 'Aave V3',
    type: 'Lending / Flash Loans',
    supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche'],
    flashLoanFeeRate: 0.0005, // 0.05%
    borrowFeeRate: 0.001, // 0.10% initiation
    estimatedGasUnits: 250000
  }
};

/**
 * Get all supported DeFi protocols and fee tiers
 */
function getAllProtocols() {
  return Object.values(DEFI_PROTOCOLS);
}

/**
 * Get details for a specific protocol
 */
function getProtocolById(id) {
  return DEFI_PROTOCOLS[id] || null;
}

/**
 * Calculate swap fee for a specific protocol and transaction amount
 */
function calculateDefiFee(protocolId, amountUsd, tierRate = null) {
  const protocol = getProtocolById(protocolId);
  if (!protocol) {
    throw new Error(`Protocol '${protocolId}' not found`);
  }

  const feeRate = tierRate !== null ? parseFloat(tierRate) : protocol.defaultFeeRate || 0.003;
  const protocolFeeUsd = amountUsd * feeRate;

  return {
    protocolId: protocol.id,
    protocolName: protocol.name,
    type: protocol.type,
    amountUsd,
    feeRate,
    feePercentage: `${(feeRate * 100).toFixed(3)}%`,
    protocolFeeUsd: parseFloat(protocolFeeUsd.toFixed(4)),
    netAmountUsd: parseFloat((amountUsd - protocolFeeUsd).toFixed(4)),
    estimatedGasUnits: protocol.estimatedGasUnits
  };
}

module.exports = {
  DEFI_PROTOCOLS,
  getAllProtocols,
  getProtocolById,
  calculateDefiFee
};
