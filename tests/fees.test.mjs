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
  analyzeDustBalances
} from '../src/services/dustService.js';
import {
  searchClaimableRewards
} from '../src/services/rewardService.js';
import {
  searchTokenApprovals
} from '../src/services/approvalService.js';
import {
  analyzeFeeOptimization
} from '../src/services/optimizerService.js';
import {
  getMergedCrossChainPortfolio
} from '../src/services/crossChainService.js';
import {
  askAiAssistant
} from '../src/services/aiAssistantService.js';
import {
  generateAnalyticsReport
} from '../src/services/analyticsService.js';
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

const DEMO_SOLANA_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const DEMO_EVM_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('Crypto Fee Finder & ChainRecover AI Services', () => {
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

  it('should analyze dust balances, rewards, approvals, optimizer, and merged portfolio', async () => {
    const dust = analyzeDustBalances(DEMO_SOLANA_WALLET, 5.00);
    expect(dust.totalDustCount).toBeGreaterThan(0);

    const rewards = searchClaimableRewards(DEMO_SOLANA_WALLET);
    expect(rewards.categoryBreakdown.length).toBe(5);

    const approvals = searchTokenApprovals(DEMO_EVM_WALLET, 'ALL');
    expect(approvals.summary.totalApprovalsCount).toBe(5);

    const fullAnalysis = analyzeFeeOptimization({ chain: 'ethereum', transactionType: 'SWAP' });
    expect(fullAnalysis.savingsEstimate.annualEstimatedSavingsUsd).toBeGreaterThan(0);

    const merged = await getMergedCrossChainPortfolio(DEMO_SOLANA_WALLET, DEMO_EVM_WALLET);
    expect(merged.supportedChainsCount).toBe(7);

    const aiRes = await askAiAssistant(DEMO_SOLANA_WALLET, 'What can I recover?');
    expect(aiRes.category).toBe('RECOVERABLE_ASSETS_SUMMARY');

    const analytics = generateAnalyticsReport(DEMO_SOLANA_WALLET);
    expect(analytics.portfolioAllocation.totalValueUsd).toBeGreaterThan(0);
  });
});

describe('SECURITY ARCHITECTURE ENFORCEMENTS', () => {
  it('should strictly reject seed phrases and private keys under Zero-Key policy', () => {
    // Test 12-word seed phrase rejection
    const seedPhrase12 = 'apple banana cherry dog elephant fox grape hat ice jungle kite lemon';
    expect(() => assertNoPrivateKeysOrSeedPhrases(seedPhrase12)).toThrow('SECURITY VIOLATION');

    // Test 64-char EVM private key rejection
    const evmPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(() => assertNoPrivateKeysOrSeedPhrases(evmPrivateKey)).toThrow('SECURITY VIOLATION');
  });

  it('should encrypt and decrypt sensitive session payloads via AES-256-GCM', () => {
    const secretMessage = 'session_wallet_metadata_payload';
    const encrypted = encryptPayload(secretMessage);
    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.iv).toBeDefined();

    const decrypted = decryptPayload(encrypted);
    expect(decrypted).toBe(secretMessage);
  });

  it('should validate transactions before execution and block malicious drainers', () => {
    const validResult = validateTransactionForExecution({
      walletAddress: DEMO_EVM_WALLET,
      toAddress: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      actionType: 'REVOKE_APPROVAL',
      calldata: '0x095ea7b30000000000000000000000001111111254fb6c44bac0bed2854e76f90643097d0000000000000000000000000000000000000000000000000000000000000000'
    });
    expect(validResult.isValid).toBe(true);
    expect(validResult.simulationStatus).toBe('SIMULATION_PASSED_ZERO_RISK');

    // Test Blacklisted drainer blocking
    expect(() => validateTransactionForExecution({
      walletAddress: DEMO_EVM_WALLET,
      toAddress: KNOWN_DRAINER_BLACKLIST[0]
    })).toThrow('SECURITY ALERT');
  });

  it('should issue JWT tokens for wallet authentication', () => {
    const jwtToken = generateWalletJwt(DEMO_EVM_WALLET);
    expect(jwtToken).toBeDefined();
    expect(typeof jwtToken).toBe('string');
  });

  it('POST /api/v1/auth/wallet-login should authenticate wallet and issue JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/wallet-login')
      .send({ walletAddress: DEMO_EVM_WALLET });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});
