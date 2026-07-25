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
  validateTransactionForExecution,
  KNOWN_DRAINER_BLACKLIST
} from '../src/services/securityValidatorService.js';
import {
  generateWalletJwt
} from '../src/middleware/authMiddleware.js';
import {
  getAdminDashboardSummary,
  getAdminUsers,
  getAdminWallets,
  getAdminScans,
  getAdminRevenue,
  getAdminApiUsage,
  getAdminLogs,
  getAdminErrors
} from '../src/services/adminService.js';

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
    expect(summary.totalEmptyAccountsCount).toBe(5);
  });
});

describe('SECURITY ARCHITECTURE ENFORCEMENTS', () => {
  it('should strictly reject seed phrases and private keys under Zero-Key policy', () => {
    const seedPhrase12 = 'apple banana cherry dog elephant fox grape hat ice jungle kite lemon';
    expect(() => assertNoPrivateKeysOrSeedPhrases(seedPhrase12)).toThrow('SECURITY VIOLATION');

    const evmPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(() => assertNoPrivateKeysOrSeedPhrases(evmPrivateKey)).toThrow('SECURITY VIOLATION');
  });

  it('should encrypt and decrypt sensitive session payloads via AES-256-GCM', () => {
    const secretMessage = 'session_wallet_metadata_payload';
    const encrypted = encryptPayload(secretMessage);
    expect(encrypted.encryptedData).toBeDefined();

    const decrypted = decryptPayload(encrypted);
    expect(decrypted).toBe(secretMessage);
  });
});

describe('ADMIN PANEL MANAGEMENT SERVICE', () => {
  it('should provide executive dashboard summary metrics', () => {
    const dashboard = getAdminDashboardSummary();
    expect(dashboard.metrics.totalUsersCount).toBeGreaterThan(0);
    expect(dashboard.metrics.monthlyRecurringRevenueUsd).toBeGreaterThan(0);
  });

  it('should fetch users, wallets, scans, revenue, API usage, logs, and errors', () => {
    const users = getAdminUsers();
    expect(users.length).toBeGreaterThan(0);

    const wallets = getAdminWallets();
    expect(wallets.length).toBeGreaterThan(0);

    const scans = getAdminScans();
    expect(scans.scansByChain.length).toBe(6);

    const revenue = getAdminRevenue();
    expect(revenue.monthlyRecurringRevenueUsd).toBeGreaterThan(0);

    const apiUsage = getAdminApiUsage();
    expect(apiUsage.endpointHitCounters.length).toBeGreaterThan(0);

    const logs = getAdminLogs();
    expect(logs.length).toBeGreaterThan(0);

    const errors = getAdminErrors();
    expect(errors.totalErrors24h).toBeDefined();
  });
});

describe('ADMIN PANEL REST ENDPOINTS', () => {
  it('GET /api/v1/admin/dashboard should return summary metrics', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.totalUsersCount).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/users should return users list', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/wallets should return wallets list', async () => {
    const res = await request(app).get('/api/v1/admin/wallets');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/scans should return scan metrics', async () => {
    const res = await request(app).get('/api/v1/admin/scans');
    expect(res.status).toBe(200);
    expect(res.body.data.scansByChain.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/revenue should return MRR/ARR metrics', async () => {
    const res = await request(app).get('/api/v1/admin/revenue');
    expect(res.status).toBe(200);
    expect(res.body.data.monthlyRecurringRevenueUsd).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/api-usage should return RPC metrics', async () => {
    const res = await request(app).get('/api/v1/admin/api-usage');
    expect(res.status).toBe(200);
    expect(res.body.data.endpointHitCounters.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/logs should return system logs', async () => {
    const res = await request(app).get('/api/v1/admin/logs');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/errors should return error logs', async () => {
    const res = await request(app).get('/api/v1/admin/errors');
    expect(res.status).toBe(200);
    expect(res.body.data.totalErrors24h).toBeDefined();
  });
});
