/**
 * ChainRecover AI - Module 6: Fee Optimizer Engine
 * 
 * Functions:
 * 1. Estimate Gas (Transfers, Swaps, Mints, Deploys)
 * 2. Recommend Cheaper Execution Time (Off-peak low Gwei windows)
 * 3. Recommend Better RPC (Latency benchmarks & MEV protection)
 * 4. Estimate Savings (Per transaction & annual USD savings)
 */

const { CHAIN_GAS_METRICS, estimateGasCostUsd } = require('./feeCalculator');

// Standard Gas Units consumed per transaction type
const TX_GAS_UNITS = {
  TRANSFER: 21000,
  SWAP: 150000,
  NFT_MINT: 180000,
  CONTRACT_DEPLOY: 850000
};

// RPC Providers Benchmark database
const RPC_PROVIDERS = {
  ethereum: [
    { name: 'Flashbots Protect RPC', url: 'https://rpc.flashbots.net', latencyMs: 28, mevProtection: 'FULL_PROTECTION', status: 'RECOMMENDED_OPTIMAL' },
    { name: 'Alchemy Private RPC', url: 'https://eth-mainnet.g.alchemy.com/v2/...', latencyMs: 18, mevProtection: 'STANDARD', status: 'FAST' },
    { name: 'QuickNode High-Speed', url: 'https://eth.quiknode.pro/...', latencyMs: 15, mevProtection: 'STANDARD', status: 'ULTRA_FAST' },
    { name: 'Ankr Public Fallback', url: 'https://rpc.ankr.com/eth', latencyMs: 52, mevProtection: 'NONE', status: 'PUBLIC_FALLBACK' }
  ],
  solana: [
    { name: 'Helius Priority RPC', url: 'https://mainnet.helius-rpc.com/...', latencyMs: 12, mevProtection: 'JITO_BUNDLE_MEV', status: 'RECOMMENDED_OPTIMAL' },
    { name: 'Triton RPC Pool', url: 'https://solana-mainnet.rpcpool.com', latencyMs: 16, mevProtection: 'STANDARD', status: 'FAST' },
    { name: 'Solana Public RPC', url: 'https://api.mainnet-beta.solana.com', latencyMs: 65, mevProtection: 'NONE', status: 'PUBLIC_FALLBACK' }
  ],
  arbitrum: [
    { name: 'Alchemy Arbitrum RPC', url: 'https://arb-mainnet.g.alchemy.com/v2/...', latencyMs: 14, mevProtection: 'STANDARD', status: 'RECOMMENDED_OPTIMAL' },
    { name: 'Arbitrum One Public RPC', url: 'https://arb1.arbitrum.io/rpc', latencyMs: 38, mevProtection: 'NONE', status: 'PUBLIC_FALLBACK' }
  ],
  polygon: [
    { name: 'QuickNode Polygon RPC', url: 'https://polygon-mainnet.quiknode.pro/...', latencyMs: 16, mevProtection: 'STANDARD', status: 'RECOMMENDED_OPTIMAL' },
    { name: 'Polygon PoS Public RPC', url: 'https://polygon-rpc.com', latencyMs: 42, mevProtection: 'NONE', status: 'PUBLIC_FALLBACK' }
  ]
};

/**
 * MODULE 6: 1. Estimate Transaction Gas
 */
function estimateTransactionGas(chain = 'ethereum', transactionType = 'SWAP') {
  const c = chain.toLowerCase();
  const txType = transactionType.toUpperCase();
  const gasUnits = TX_GAS_UNITS[txType] || 150000;

  const currentGasUsd = estimateGasCostUsd(c, gasUnits);

  return {
    chain: c,
    transactionType: txType,
    estimatedGasUnits: gasUnits,
    estimatedCurrentGasUsd: currentGasUsd
  };
}

/**
 * MODULE 6: 2. Recommend Cheaper Execution Time
 */
function recommendCheaperExecutionTime(chain = 'ethereum') {
  const c = chain.toLowerCase();

  const timeRecommendations = {
    ethereum: {
      currentGwei: 18,
      offPeakGweiTarget: 7,
      optimalTimeWindowUtc: '02:00 - 06:00 UTC (Sundays)',
      estimatedSavingsPercent: '61%',
      advice: 'Execute large swaps or deployments on Sunday early morning UTC when gas drops below 8 Gwei.'
    },
    arbitrum: {
      currentGwei: 0.1,
      offPeakGweiTarget: 0.05,
      optimalTimeWindowUtc: '04:00 - 08:00 UTC (Daily)',
      estimatedSavingsPercent: '50%',
      advice: 'L2 sequence fees are lowest during Asia-Pacific morning hours.'
    },
    polygon: {
      currentGwei: 45,
      offPeakGweiTarget: 22,
      optimalTimeWindowUtc: '01:00 - 05:00 UTC (Weekends)',
      estimatedSavingsPercent: '51%',
      advice: 'Polygon gas spikes during NFT mints. Target weekend off-peak hours.'
    },
    solana: {
      currentGwei: 0.001,
      offPeakGweiTarget: 0.0005,
      optimalTimeWindowUtc: 'Always Low',
      estimatedSavingsPercent: '15%',
      advice: 'Solana base gas is steady. Use priority fees only during high network congestion.'
    }
  };

  return timeRecommendations[c] || timeRecommendations.ethereum;
}

/**
 * MODULE 6: 3. Recommend Better RPC Node
 */
function recommendBetterRpc(chain = 'ethereum') {
  const c = chain.toLowerCase();
  const providers = RPC_PROVIDERS[c] || RPC_PROVIDERS.ethereum;
  const optimalRpc = providers.find(p => p.status === 'RECOMMENDED_OPTIMAL') || providers[0];

  return {
    chain: c,
    recommendedRpc: optimalRpc,
    allEvaluatedProviders: providers
  };
}

/**
 * MODULE 6: 4. Estimate USD Savings
 */
function estimateSavings(currentGasUsd, offPeakGasUsd, txCountPerYear = 120) {
  const perTxSavingsUsd = Math.max(0, currentGasUsd - offPeakGasUsd);
  const annualSavingsUsd = perTxSavingsUsd * txCountPerYear;

  return {
    currentPerTxGasUsd: currentGasUsd,
    offPeakPerTxGasUsd: offPeakGasUsd,
    perTxSavingsUsd: parseFloat(perTxSavingsUsd.toFixed(2)),
    annualTxCountEstimate: txCountPerYear,
    annualEstimatedSavingsUsd: parseFloat(annualSavingsUsd.toFixed(2))
  };
}

/**
 * MODULE 6: Main Comprehensive Fee Optimization Analysis
 */
function analyzeFeeOptimization({ chain = 'ethereum', transactionType = 'SWAP', txCountPerYear = 120 }) {
  const gasEstimate = estimateTransactionGas(chain, transactionType);
  const timeRecommendation = recommendCheaperExecutionTime(chain);
  const rpcRecommendation = recommendBetterRpc(chain);

  // Compute off-peak gas cost based on percentage savings
  const savingsMult = 1 - (parseFloat(timeRecommendation.estimatedSavingsPercent) / 100);
  const offPeakGasUsd = parseFloat((gasEstimate.estimatedCurrentGasUsd * savingsMult).toFixed(4));

  const savings = estimateSavings(gasEstimate.estimatedCurrentGasUsd, offPeakGasUsd, txCountPerYear);

  return {
    chain,
    transactionType,
    analysisTimestamp: new Date().toISOString(),
    gasEstimation: gasEstimate,
    timeOptimization: timeRecommendation,
    rpcOptimization: rpcRecommendation,
    savingsEstimate: savings
  };
}

module.exports = {
  TX_GAS_UNITS,
  RPC_PROVIDERS,
  estimateTransactionGas,
  recommendCheaperExecutionTime,
  recommendBetterRpc,
  estimateSavings,
  analyzeFeeOptimization
};
