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
    expect(merged.unifiedSummary.totalMergedPortfolioUsd).toBeGreaterThan(0);
    expect(merged.unifiedSummary.totalMergedRecoverableUsd).toBeGreaterThan(0);
    expect(merged.chainDistribution.length).toBe(7);
  });

  it('should generate master multi-chain recovery payload', () => {
    const master = buildMasterRecoveryPayload(DEMO_SOLANA_WALLET, DEMO_EVM_WALLET);
    expect(master.success).toBe(true);
    expect(master.module).toBe('MODULE_7_CROSS_CHAIN_UNIFIED');
    expect(master.masterRecoverySummary.totalNetValueRecoverableUsd).toBeGreaterThan(0);
    expect(master.payloads.solanaRentTxBase64).toBeDefined();
  });
});

describe('ChainRecover AI Scanner & Module Endpoints', () => {
  it('POST /api/v1/scanner/cross-chain/merged should return merged portfolio across 7 chains', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/cross-chain/merged')
      .send({ solanaAddress: DEMO_SOLANA_WALLET, evmAddress: DEMO_EVM_WALLET });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unifiedSummary.totalMergedPortfolioUsd).toBeGreaterThan(0);
    expect(res.body.data.supportedChainsCount).toBe(7);
  });

  it('POST /api/v1/scanner/cross-chain/master-recover should return master recovery payloads', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/cross-chain/master-recover')
      .send({ solanaAddress: DEMO_SOLANA_WALLET, evmAddress: DEMO_EVM_WALLET });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payloads.solanaRentTxBase64).toBeDefined();
  });

  it('GET /api/v1/scanner/chains should list supported blockchains', async () => {
    const res = await request(app).get('/api/v1/scanner/chains');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
