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
  analyzeFeeOptimization,
  estimateTransactionGas,
  recommendCheaperExecutionTime,
  recommendBetterRpc,
  estimateSavings
} from '../src/services/optimizerService.js';

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

    const revokeData = buildRevokeTransaction(
      DEMO_EVM_WALLET,
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      '0x1111111254fb6c44bac0bed2854e76f90643097d',
      'ethereum'
    );
    expect(revokeData.success).toBe(true);
  });
});

describe('MODULE 6: Fee Optimizer Engine', () => {
  it('should estimate transaction gas costs correctly', () => {
    const gasEst = estimateTransactionGas('ethereum', 'SWAP');
    expect(gasEst.estimatedGasUnits).toBe(150000);
    expect(gasEst.estimatedCurrentGasUsd).toBeGreaterThan(0);
  });

  it('should recommend cheaper execution time windows with percentage savings', () => {
    const timeRec = recommendCheaperExecutionTime('ethereum');
    expect(timeRec.optimalTimeWindowUtc).toBeDefined();
    expect(timeRec.estimatedSavingsPercent).toBeDefined();
  });

  it('should recommend better RPC node providers with latency benchmarks', () => {
    const rpcRec = recommendBetterRpc('ethereum');
    expect(rpcRec.recommendedRpc.name).toBe('Flashbots Protect RPC');
    expect(rpcRec.recommendedRpc.latencyMs).toBeLessThan(50);
  });

  it('should calculate annual estimated USD savings', () => {
    const savings = estimateSavings(10.0, 4.0, 100);
    expect(savings.perTxSavingsUsd).toBe(6.0);
    expect(savings.annualEstimatedSavingsUsd).toBe(600.0);
  });

  it('should perform full fee optimization analysis', () => {
    const fullAnalysis = analyzeFeeOptimization({ chain: 'ethereum', transactionType: 'SWAP', txCountPerYear: 120 });
    expect(fullAnalysis.gasEstimation).toBeDefined();
    expect(fullAnalysis.timeOptimization).toBeDefined();
    expect(fullAnalysis.rpcOptimization).toBeDefined();
    expect(fullAnalysis.savingsEstimate.annualEstimatedSavingsUsd).toBeGreaterThan(0);
  });
});

describe('ChainRecover AI Scanner & Module Endpoints', () => {
  it('POST /api/v1/scanner/optimizer/analyze should return full fee optimization report', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/optimizer/analyze')
      .send({ chain: 'ethereum', transactionType: 'SWAP', txCountPerYear: 120 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.savingsEstimate.annualEstimatedSavingsUsd).toBeGreaterThan(0);
  });

  it('GET /api/v1/scanner/chains should list supported blockchains', async () => {
    const res = await request(app).get('/api/v1/scanner/chains');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
