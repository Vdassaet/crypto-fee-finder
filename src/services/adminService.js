/**
 * ChainRecover AI - Admin Panel Management Service
 * 
 * Manages:
 * 1. Users (SaaS Subscriptions & Accounts)
 * 2. Wallets (Tracked & Scanned Wallets)
 * 3. Scans (Performance & Throughput)
 * 4. Revenue (MRR, ARR & Recovery Fees)
 * 5. API Usage (RPC Calls & Endpoint Metrics)
 * 6. Logs (System Activity)
 * 7. Errors (Error Console & RPC Failures)
 */

/**
 * Executive Dashboard Overview
 */
function getAdminDashboardSummary() {
  return {
    timestamp: new Date().toISOString(),
    metrics: {
      totalUsersCount: 1420,
      activeSubscriptionsCount: 385,
      totalWalletsScannedCount: 3850,
      totalScansCompletedCount: 12480,
      totalValueRecoveredUsd: 148250.00,
      monthlyRecurringRevenueUsd: 18450.00,
      annualRecurringRevenueUsd: 221400.00,
      rpcNodeUptimePercent: 99.94,
      systemErrors24h: 2
    }
  };
}

/**
 * 1. Users Management
 */
function getAdminUsers() {
  return [
    { id: 'usr_101', name: 'Alex Rivera', email: 'alex@chainrecover.ai', plan: 'PRO_SAAS', planPriceUsd: 49.00, registeredWalletsCount: 4, status: 'ACTIVE', lastActive: '2 mins ago' },
    { id: 'usr_102', name: 'Elena Rostova', email: 'elena@crypto.io', plan: 'ENTERPRISE', planPriceUsd: 199.00, registeredWalletsCount: 12, status: 'ACTIVE', lastActive: '15 mins ago' },
    { id: 'usr_103', name: 'David Chen', email: 'david@web3.dev', plan: 'FREE_TIER', planPriceUsd: 0.00, registeredWalletsCount: 1, status: 'ACTIVE', lastActive: '1 hour ago' },
    { id: 'usr_104', name: 'Sarah Jenkins', email: 'sarah@defilab.org', plan: 'PRO_SAAS', planPriceUsd: 49.00, registeredWalletsCount: 6, status: 'ACTIVE', lastActive: '3 hours ago' }
  ];
}

/**
 * 2. Wallets Management
 */
function getAdminWallets() {
  return [
    { address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', type: 'Solana', portfolioUsd: 3423.60, totalRecoveredUsd: 260.19, rentReclaimedSol: 0.0102, scanCount: 14, status: 'HEALTHY' },
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', type: 'EVM Multi-Chain', portfolioUsd: 10719.50, totalRecoveredUsd: 580.40, dangerousApprovals: 4, scanCount: 32, status: 'ATTENTION_REQUIRED' },
    { address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', type: 'Solana', portfolioUsd: 12450.00, totalRecoveredUsd: 145.00, rentReclaimedSol: 0.0081, scanCount: 8, status: 'HEALTHY' },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', type: 'Arbitrum', portfolioUsd: 552.50, totalRecoveredUsd: 48.50, dangerousApprovals: 0, scanCount: 5, status: 'HEALTHY' }
  ];
}

/**
 * 3. Scans Performance & Metrics
 */
function getAdminScans() {
  return {
    totalScansCompleted: 12480,
    averageScanDurationMs: 420,
    scansByChain: [
      { chain: 'Solana', count: 4850, avgDurationMs: 310 },
      { chain: 'Ethereum', count: 3420, avgDurationMs: 480 },
      { chain: 'Arbitrum', count: 1850, avgDurationMs: 380 },
      { chain: 'Base', count: 1120, avgDurationMs: 350 },
      { chain: 'Polygon', count: 840, avgDurationMs: 410 },
      { chain: 'Optimism', count: 400, avgDurationMs: 390 }
    ],
    recentScans: [
      { scanId: 'scn_9912', wallet: '7xKXtg...gAsU', chainsScanned: 7, assetsFoundCount: 12, recoverableUsd: 260.19, durationMs: 390, timestamp: '1 min ago' },
      { scanId: 'scn_9911', wallet: '0xd8dA...6045', chainsScanned: 5, assetsFoundCount: 18, recoverableUsd: 580.40, durationMs: 450, timestamp: '4 mins ago' },
      { scanId: 'scn_9910', wallet: '4k3Dyj...kX6R', chainsScanned: 1, assetsFoundCount: 4, recoverableUsd: 145.00, durationMs: 290, timestamp: '8 mins ago' }
    ]
  };
}

/**
 * 4. Revenue Metrics (MRR / ARR / Commission)
 */
function getAdminRevenue() {
  return {
    monthlyRecurringRevenueUsd: 18450.00,
    annualRecurringRevenueUsd: 221400.00,
    recoverySuccessFeeShareUsd: 14825.00, // 10% cut on recovered assets
    mrrGrowthPercentage: '+18.4% MoM',
    breakdownByPlan: [
      { plan: 'PRO_SAAS ($49/mo)', activeSubscribers: 285, monthlyRevenueUsd: 13965.00 },
      { plan: 'ENTERPRISE ($199/mo)', activeSubscribers: 22, monthlyRevenueUsd: 4378.00 },
      { plan: 'RECOVERY_FEE_COMMISSION', activeTransactions: 412, monthlyRevenueUsd: 14825.00 }
    ]
  };
}

/**
 * 5. API Usage & RPC Node Metrics
 */
function getAdminApiUsage() {
  return {
    totalApiRequests24h: 184200,
    averageResponseTimeMs: 45,
    rateLimitUtilizationPercent: 24.5,
    endpointHitCounters: [
      { endpoint: '/api/v1/scanner/wallet/:address', hits24h: 68400 },
      { endpoint: '/api/v1/scanner/solana/rent/:address', hits24h: 42100 },
      { endpoint: '/api/v1/scanner/dust/analyze', hits24h: 31200 },
      { endpoint: '/api/v1/scanner/rewards/search', hits24h: 24500 },
      { endpoint: '/api/v1/scanner/approvals/search', hits24h: 18000 }
    ],
    rpcNodeHealth: [
      { provider: 'Helius Solana RPC', chain: 'solana', latencyMs: 12, status: 'OPTIMAL' },
      { provider: 'Flashbots Protect RPC', chain: 'ethereum', latencyMs: 28, status: 'OPTIMAL' },
      { provider: 'Alchemy Arbitrum RPC', chain: 'arbitrum', latencyMs: 14, status: 'OPTIMAL' },
      { provider: 'QuickNode Polygon RPC', chain: 'polygon', latencyMs: 16, status: 'OPTIMAL' }
    ]
  };
}

/**
 * 6. Real-Time System Logs
 */
function getAdminLogs() {
  return [
    { logId: 'log_881', timestamp: new Date().toISOString(), level: 'INFO', module: 'SOLANA_RENT', message: 'CloseAccount instruction Base64 payload built for 7xKXtg...gAsU (0.0102 SOL refund).' },
    { logId: 'log_880', timestamp: new Date().toISOString(), level: 'INFO', module: 'APPROVAL_REVOKER', message: 'approve(spender, 0) calldata generated for token 0x6B17...1d0F.' },
    { logId: 'log_879', timestamp: new Date().toISOString(), level: 'SECURITY', module: 'AUTH_JWT', message: 'JWT token issued via non-custodial wallet signature for 0xd8dA...6045.' },
    { logId: 'log_878', timestamp: new Date().toISOString(), level: 'INFO', module: 'AI_ASSISTANT', message: 'AI query processed: "What can I recover?" (Response time: 85ms).' }
  ];
}

/**
 * 7. Error Console & Tracking
 */
function getAdminErrors() {
  return {
    totalErrors24h: 2,
    errorRatePercent: '0.001%',
    recentErrors: [
      { errorId: 'err_401', timestamp: '12 mins ago', code: 400, module: 'SOLANA_RENT', message: 'Invalid Solana base58 address string passed.', resolved: true },
      { errorId: 'err_402', timestamp: '2 hours ago', code: 504, module: 'RPC_PROVIDER', message: 'Ankr fallback RPC timeout (retried via Alchemy - OK).', resolved: true }
    ]
  };
}

module.exports = {
  getAdminDashboardSummary,
  getAdminUsers,
  getAdminWallets,
  getAdminScans,
  getAdminRevenue,
  getAdminApiUsage,
  getAdminLogs,
  getAdminErrors
};
