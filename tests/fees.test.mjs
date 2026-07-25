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

const DEMO_SOLANA_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const DEMO_EVM_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('Crypto Fee Finder Services', () => {
  it('should fetch gas metrics for supported chains', () => {
    const ethGas = getGasMetrics('ethereum');
    expect(ethGas).toBeDefined();
    expect(ethGas.chain).toBe('ethereum');
    expect(ethGas.nativeSymbol).toBe('ETH');
  });

  it('should calculate DeFi swap fees accurately', () => {
    const calculation = calculateDefiFee('uniswap_v3', 1000, 0.0005);
    expect(calculation.protocolId).toBe('uniswap_v3');
    expect(calculation.netAmountUsd).toBe(999.5);
  });
});

describe('MODULE 2: Solana Rent Recovery Engine', () => {
  it('should validate Solana public keys', () => {
    expect(isValidSolanaPublicKey(DEMO_SOLANA_WALLET)).toBe(true);
  });

  it('should detect empty SPL Token accounts & calculate rent recoverable', async () => {
    const summary = await findEmptyTokenAccounts(DEMO_SOLANA_WALLET);
    expect(summary.totalEmptyAccountsCount).toBe(5);
  });
});

describe('MODULE 3: Dust Consolidation Engine', () => {
  it('should detect dust balances below user threshold and offer 4 strategies', () => {
    const report = analyzeDustBalances(DEMO_SOLANA_WALLET, 5.00);
    expect(report.thresholdUsd).toBe(5.00);
    expect(report.dustTokens[0].strategies.swap).toBeDefined();
  });
});

describe('MODULE 4: Reward Scanner Engine', () => {
  it('should search 5 categories of claimable rewards', () => {
    const report = searchClaimableRewards(DEMO_SOLANA_WALLET);
    expect(report.categoryBreakdown.length).toBe(5);
  });
});

describe('MODULE 5: Approval Scanner & Revoker Engine', () => {
  it('should search active token approvals across 5 EVM networks and flag unlimited allowances', () => {
    const report = searchTokenApprovals(DEMO_EVM_WALLET, 'ALL');
    expect(report.summary.totalApprovalsCount).toBe(5);
    expect(report.summary.unlimitedApprovalsCount).toBe(4);
    expect(report.approvals.some(a => a.riskLevel === 'CRITICAL')).toBe(true);
  });

  it('should build unsigned ERC-20 approve(spender, 0) revoke transaction payload', () => {
    const revokeData = buildRevokeTransaction(
      DEMO_EVM_WALLET,
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      '0x1111111254fb6c44bac0bed2854e76f90643097d',
      'ethereum'
    );
    expect(revokeData.success).toBe(true);
    expect(revokeData.module).toBe('MODULE_5_APPROVAL_REVOKER');
    expect(revokeData.transactionPayload.data).toContain('0x095ea7b3');
  });
});

describe('ChainRecover AI Scanner & Module Endpoints', () => {
  it('POST /api/v1/scanner/approvals/search should return token approvals report', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/approvals/search')
      .send({ walletAddress: DEMO_EVM_WALLET, chain: 'ethereum' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalApprovalsCount).toBeGreaterThan(0);
  });

  it('POST /api/v1/scanner/approvals/revoke should return approve(spender, 0) tx payload', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/approvals/revoke')
      .send({
        walletAddress: DEMO_EVM_WALLET,
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        spenderAddress: '0x1111111254fb6c44bac0bed2854e76f90643097d',
        chain: 'ethereum'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactionPayload.data).toContain('0x095ea7b3');
  });

  it('GET /api/v1/scanner/chains should list supported blockchains', async () => {
    const res = await request(app).get('/api/v1/scanner/chains');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(7);
  });
});
