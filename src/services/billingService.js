/**
 * ChainRecover AI - Module 10: Business Model & SaaS Monetization Engine
 * 
 * Tiers:
 * 1. Free Tier: 1 scan/day quota per wallet
 * 2. Premium Pro ($49/mo): Unlimited scans, Advanced Analytics, Priority RPC, Multi-wallet support
 * 3. Enterprise API ($199/mo): High-throughput REST API key access
 * 4. Optional Performance Fee Model: 10% charged ONLY on successfully recovered funds
 */

const SAAS_TIERS = {
  FREE: {
    id: 'FREE_TIER',
    name: 'Freemium Explorer',
    priceUsdMonth: 0,
    scanQuotaPerDay: 1,
    features: [
      '1 scan per day limit',
      'Solana Rent Recovery detection',
      'Basic Dust & Reward scanning',
      'Standard public RPC nodes'
    ]
  },
  PREMIUM_PRO: {
    id: 'PREMIUM_PRO',
    name: 'Premium Pro SaaS',
    priceUsdMonth: 49,
    scanQuotaPerDay: -1, // Unlimited
    features: [
      'Unlimited scans across all 7 chains',
      'Advanced 12-month analytics & savings curve',
      'Priority Flashbots & Helius MEV-protected RPC nodes',
      'Multi-wallet merged portfolio dashboard',
      'Unlimited ERC-20 approval revoker'
    ]
  },
  ENTERPRISE_API: {
    id: 'ENTERPRISE_API',
    name: 'Enterprise API',
    priceUsdMonth: 199,
    scanQuotaPerDay: -1, // Unlimited
    features: [
      'High-throughput REST API key access',
      'Dedicated private RPC node infrastructure',
      'Unlimited team seats & multi-organization management',
      '24/7 Priority SLA engineering support'
    ]
  },
  PERFORMANCE_COMMISSION: {
    id: 'PERFORMANCE_COMMISSION',
    name: '10% Success Recovery Fee',
    ratePercent: 10,
    description: 'Zero upfront cost. We only charge a 10% performance fee on successfully recovered funds.'
  }
};

// In-memory daily quota tracker: Map<walletAddress, { count: number, lastScanTimestamp: Date }>
const walletScanQuotaMap = new Map();

/**
 * Verifies if user wallet has remaining daily scan quota under Freemium rules
 */
function checkUserScanQuota(walletAddress, userTier = 'FREE') {
  const addr = (walletAddress || 'demo_wallet').toLowerCase();
  const tier = SAAS_TIERS[userTier] || SAAS_TIERS.FREE;

  // Premium / Enterprise have unlimited quota
  if (tier.scanQuotaPerDay === -1) {
    return {
      allowed: true,
      remainingQuota: 'UNLIMITED',
      tier: tier.name,
      message: 'Unlimited scans active on Premium plan.'
    };
  }

  const now = new Date();
  const quotaRecord = walletScanQuotaMap.get(addr);

  if (!quotaRecord) {
    // First scan today
    walletScanQuotaMap.set(addr, { count: 1, resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000) });
    return {
      allowed: true,
      scansUsedToday: 1,
      remainingQuota: 0,
      resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      tier: tier.name,
      message: 'Free scan 1 of 1 used today.'
    };
  }

  // Check if 24h reset window has passed
  if (now > quotaRecord.resetTime) {
    walletScanQuotaMap.set(addr, { count: 1, resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000) });
    return {
      allowed: true,
      scansUsedToday: 1,
      remainingQuota: 0,
      resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      tier: tier.name,
      message: 'Free scan 1 of 1 used today.'
    };
  }

  // Quota exceeded
  if (quotaRecord.count >= tier.scanQuotaPerDay) {
    return {
      allowed: false,
      scansUsedToday: quotaRecord.count,
      remainingQuota: 0,
      resetTime: quotaRecord.resetTime.toISOString(),
      tier: tier.name,
      message: 'Free daily scan limit reached (1 scan/day). Upgrade to Premium Pro ($49/mo) for unlimited scans.',
      upgradePrompt: {
        proPriceMonthUsd: 49,
        proFeatures: SAAS_TIERS.PREMIUM_PRO.features
      }
    };
  }

  quotaRecord.count += 1;
  walletScanQuotaMap.set(addr, quotaRecord);

  return {
    allowed: true,
    scansUsedToday: quotaRecord.count,
    remainingQuota: tier.scanQuotaPerDay - quotaRecord.count,
    tier: tier.name
  };
}

/**
 * Calculates 10% Performance Success Fee on recovered funds
 */
function calculateRecoveryCommission(recoveredAmountUsd) {
  const grossUsd = parseFloat(recoveredAmountUsd) || 0;
  const commissionUsd = parseFloat((grossUsd * 0.10).toFixed(2));
  const netUserUsd = parseFloat((grossUsd - commissionUsd).toFixed(2));

  return {
    grossRecoveredUsd: grossUsd,
    performanceCommissionRatePercent: 10,
    commissionFeeUsd: commissionUsd,
    netUserReceivedUsd: netUserUsd,
    policy: 'Fee is deducted ONLY upon successful signature execution and transaction completion.'
  };
}

module.exports = {
  SAAS_TIERS,
  checkUserScanQuota,
  calculateRecoveryCommission
};
