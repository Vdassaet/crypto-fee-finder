import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { getGasMetrics } from '../src/services/feeCalculator.js';
import { calculateDefiFee } from '../src/services/defiService.js';
import { getAvailableBridges, calculateBridgeFee } from '../src/services/bridgeService.js';
import {
  findEmptyTokenAccounts,
  buildCloseAccountTransaction,
  isValidSolanaPublicKey
} from '../src/services/solanaRentService.js';
import {
  analyzeDustBalances,
  buildDustConsolidationTransaction
} from '../src/services/dustService.js';
import {
  searchClaimableRewards,
  buildClaimTransaction
} from '../src/services/rewardService.js';
import {
  searchTokenApprovals,
  buildRevokeTransaction
} from '../src/services/approvalService.js';
import {
  analyzeFeeOptimization
} from '../src/services/optimizerService.js';
import {
  getMergedCrossChainPortfolio,
  buildMasterRecoveryPayload
} from '../src/services/crossChainService.js';
import {
  askAiAssistant
} from '../src/services/aiAssistantService.js';

const DEMO_SOLANA_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const DEMO_EVM_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('Crypto Fee Finder Services', () => {
  it('should fetch gas metrics for supported chains', () => {
    const ethGas = getGasMetrics('ethereum');
    expect(ethGas).toBeDefined();
    expect(ethGas.chain).toBe('ethereum');
  });

  it('should calculate DeFi swap fees accurately', () => {
    const calculation = calculateDefiFee('uniswap_v3', 1000, 0.0005);
    expect(calculation.protocolId).toBe('uniswap_v3');
  });
});

describe('MODULE 2: Solana Rent Recovery Engine', () => {
  it('should validate Solana public keys and detect empty SPL accounts', async () => {
    expect(isValidSolanaPublicKey(DEMO_SOLANA_WALLET)).toBe(true);
    const summary = await findEmptyTokenAccounts(DEMO_SOLANA_WALLET);
    expect(summary.totalEmptyAccountsCount).toBe(5);
  });
});

describe('MODULE 3: Dust Consolidation Engine', () => {
  it('should detect dust balances below user threshold and offer strategies', () => {
    const report = analyzeDustBalances(DEMO_SOLANA_WALLET, 5.00);
    expect(report.thresholdUsd).toBe(5.00);
  });
});

describe('MODULE 4: Reward Scanner Engine', () => {
  it('should search 5 categories of claimable rewards', () => {
    const report = searchClaimableRewards(DEMO_SOLANA_WALLET);
    expect(report.categoryBreakdown.length).toBe(5);
  });
});

describe('MODULE 5: Approval Scanner & Revoker Engine', () => {
  it('should search active token approvals and build revoke transaction payload', () => {
    const report = searchTokenApprovals(DEMO_EVM_WALLET, 'ALL');
    expect(report.summary.totalApprovalsCount).toBe(5);
  });
});

describe('MODULE 6: Fee Optimizer Engine', () => {
  it('should perform full fee optimization analysis', () => {
    const fullAnalysis = analyzeFeeOptimization({ chain: 'ethereum', transactionType: 'SWAP', txCountPerYear: 120 });
    expect(fullAnalysis.savingsEstimate.annualEstimatedSavingsUsd).toBeGreaterThan(0);
  });
});

describe('MODULE 7: Cross-chain Scanner & Merged Unified Dashboard Engine', () => {
  it('should aggregate assets across all 7 supported chains into one merged portfolio', async () => {
    const merged = await getMergedCrossChainPortfolio(DEMO_SOLANA_WALLET, DEMO_EVM_WALLET);
    expect(merged.supportedChainsCount).toBe(7);
  });
});

describe('MODULE 8: AI Assistant Engine', () => {
  it('should answer "What can I recover?" with multi-chain asset breakdown', async () => {
    const res = await askAiAssistant(DEMO_SOLANA_WALLET, 'What can I recover?');
    expect(res.category).toBe('RECOVERABLE_ASSETS_SUMMARY');
    expect(res.explanation).toContain('$260.19 USD');
    expect(res.recommendedAction.type).toBe('MASTER_RECOVERY');
  });

  it('should answer "How much rent do I have?" with Solana rent storage breakdown', async () => {
    const res = await askAiAssistant(DEMO_SOLANA_WALLET, 'How much rent do I have?');
    expect(res.category).toBe('SOLANA_RENT_DETAILS');
    expect(res.explanation).toContain('0.00203928 SOL');
  });

  it('should answer "Why should I close these accounts?" with account closure rationale', async () => {
    const res = await askAiAssistant(DEMO_SOLANA_WALLET, 'Why should I close these accounts?');
    expect(res.category).toBe('RENT_CLOSURE_EXPLANATION');
    expect(res.explanation).toContain('100% Safe & Risk-Free');
  });

  it('should answer "Which wallet is healthiest?" with health grade evaluation', async () => {
    const res = await askAiAssistant(DEMO_EVM_WALLET, 'Which wallet is healthiest?');
    expect(res.category).toBe('WALLET_HEALTH_COMPARISON');
    expect(res.explanation).toContain('Grade A+');
  });
});

describe('ChainRecover AI Scanner & Module Endpoints', () => {
  it('POST /api/v1/scanner/ai/chat should return AI explanation & quick action', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/ai/chat')
      .send({ walletAddress: DEMO_SOLANA_WALLET, query: 'What can I recover?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.explanation).toContain('$260.19 USD');
    expect(res.body.data.recommendedAction).toBeDefined();
  });

  it('GET /api/v1/scanner/chains should list supported blockchains', async () => {
    const res = await request(app).get('/api/v1/scanner/chains');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
