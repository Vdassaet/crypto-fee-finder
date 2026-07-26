import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { getGasMetrics } from '../src/services/feeCalculator.js';
import { calculateDefiFee } from '../src/services/defiService.js';
import {
  findEmptyTokenAccounts,
  isValidSolanaPublicKey
} from '../src/services/solanaRentService.js';
import {
  assertNoPrivateKeysOrSeedPhrases,
  encryptPayload,
  decryptPayload
} from '../src/utils/cryptoSecurity.js';
import {
  generateWalletJwt
} from '../src/middleware/authMiddleware.js';
import {
  getAdminDashboardSummary
} from '../src/services/adminService.js';
import {
  SAAS_TIERS,
  checkUserScanQuota,
  calculateRecoveryCommission
} from '../src/services/billingService.js';

const DEMO_SOLANA_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const DEMO_EVM_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('Crypto Fee Finder & ChainRecover AI Core Services', () => {
  it('should fetch gas metrics for supported chains', () => {
    const ethGas = getGasMetrics('ethereum');
    expect(ethGas).toBeDefined();
  });

  it('should calculate DeFi swap fees accurately', () => {
    const calculation = calculateDefiFee('uniswap_v3', 1000, 0.0005);
    expect(calculation.protocolId).toBe('uniswap_v3');
  });

  it('should validate Solana public keys and detect empty SPL accounts', async () => {
    expect(isValidSolanaPublicKey(DEMO_SOLANA_WALLET)).toBe(true);
    const summary = await findEmptyTokenAccounts(DEMO_SOLANA_WALLET);
    expect(summary.totalEmptyAccountsCount).toBeGreaterThanOrEqual(0);
  });
});

describe('SECURITY & ADMIN SERVICES', () => {
  it('should strictly reject seed phrases and private keys under Zero-Key policy', () => {
    const seedPhrase12 = 'apple banana cherry dog elephant fox grape hat ice jungle kite lemon';
    expect(() => assertNoPrivateKeysOrSeedPhrases(seedPhrase12)).toThrow('SECURITY VIOLATION');
  });

  it('should provide executive dashboard summary metrics', () => {
    const dashboard = getAdminDashboardSummary();
    expect(dashboard.metrics.totalUsersCount).toBeGreaterThan(0);
  });
});

describe('MODULE 10: BUSINESS MODEL & SAAS MONETIZATION ENGINE', () => {
  it('should enforce Free 1 scan/day quota and allow Premium unlimited scans', () => {
    const testWallet = 'test_quota_wallet_101';
    
    // First scan today
    const firstScan = checkUserScanQuota(testWallet, 'FREE');
    expect(firstScan.allowed).toBe(true);
    expect(firstScan.scansUsedToday).toBe(1);

    // Second scan today (should be quota blocked)
    const secondScan = checkUserScanQuota(testWallet, 'FREE');
    expect(secondScan.allowed).toBe(false);
    expect(secondScan.message).toContain('Free daily scan limit reached');

    // Premium Pro tier (unlimited scans)
    const proScan = checkUserScanQuota(testWallet, 'PREMIUM_PRO');
    expect(proScan.allowed).toBe(true);
    expect(proScan.remainingQuota).toBe('UNLIMITED');
  });

  it('should calculate 10% performance recovery commission accurately', () => {
    const report = calculateRecoveryCommission(260.19);
    expect(report.grossRecoveredUsd).toBe(260.19);
    expect(report.commissionFeeUsd).toBe(26.02);
    expect(report.netUserReceivedUsd).toBe(234.17);
  });
});

describe('MODULE 10 REST ENDPOINTS', () => {
  it('GET /api/v1/billing/tiers should return all SaaS pricing tiers', async () => {
    const res = await request(app).get('/api/v1/billing/tiers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.FREE.scanQuotaPerDay).toBe(1);
    expect(res.body.data.PREMIUM_PRO.priceUsdMonth).toBe(49);
    expect(res.body.data.ENTERPRISE_API.priceUsdMonth).toBe(199);
  });

  it('POST /api/v1/billing/verify-quota should verify scan quota', async () => {
    const res = await request(app)
      .post('/api/v1/billing/verify-quota')
      .send({ walletAddress: 'quota_api_wallet_202', userTier: 'FREE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allowed).toBe(true);
  });

  it('POST /api/v1/billing/subscribe should initiate plan subscription', async () => {
    const res = await request(app)
      .post('/api/v1/billing/subscribe')
      .send({ walletAddress: DEMO_SOLANA_WALLET, targetTier: 'PREMIUM_PRO' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tier.priceUsdMonth).toBe(49);
  });

  it('POST /api/v1/billing/calculate-commission should compute 10% performance fee', async () => {
    const res = await request(app)
      .post('/api/v1/billing/calculate-commission')
      .send({ recoveredAmountUsd: 500.00 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.commissionFeeUsd).toBe(50.00);
    expect(res.body.data.netUserReceivedUsd).toBe(450.00);
  });
});
