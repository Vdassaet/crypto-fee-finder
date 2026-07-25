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

const DEMO_SOLANA_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

describe('Crypto Fee Finder Services', () => {
  it('should fetch gas metrics for supported chains', () => {
    const ethGas = getGasMetrics('ethereum');
    expect(ethGas).toBeDefined();
    expect(ethGas.chain).toBe('ethereum');
    expect(ethGas.nativeSymbol).toBe('ETH');
    expect(ethGas.gwei).toBeGreaterThan(0);
  });

  it('should calculate DeFi swap fees accurately', () => {
    const calculation = calculateDefiFee('uniswap_v3', 1000, 0.0005);
    expect(calculation.protocolId).toBe('uniswap_v3');
    expect(calculation.amountUsd).toBe(1000);
    expect(calculation.protocolFeeUsd).toBe(0.5);
    expect(calculation.netAmountUsd).toBe(999.5);
  });

  it('should filter available bridge routes between chains', () => {
    const bridges = getAvailableBridges('ethereum', 'arbitrum', 'USDC');
    expect(bridges.length).toBeGreaterThan(0);
    const stargate = bridges.find(b => b.id === 'stargate');
    expect(stargate).toBeDefined();
  });

  it('should calculate bridge fees correctly', () => {
    const bridgeFee = calculateBridgeFee('stargate', 2000, 'ethereum', 'arbitrum');
    expect(bridgeFee.bridgeId).toBe('stargate');
    expect(bridgeFee.amountUsd).toBe(2000);
    expect(bridgeFee.variableFeeUsd).toBeCloseTo(1.2, 2);
    expect(bridgeFee.fixedRelayerFeeUsd).toBe(1.2);
    expect(bridgeFee.totalBridgeFeeUsd).toBeCloseTo(2.4, 2);
  });
});

describe('MODULE 2: Solana Rent Recovery Engine', () => {
  it('should validate Solana public keys', () => {
    expect(isValidSolanaPublicKey(DEMO_SOLANA_WALLET)).toBe(true);
    expect(isValidSolanaPublicKey('invalid_short_key')).toBe(false);
  });

  it('should detect empty SPL Token accounts & calculate rent recoverable', async () => {
    const summary = await findEmptyTokenAccounts(DEMO_SOLANA_WALLET);
    expect(summary.totalEmptyAccountsCount).toBe(5);
    expect(summary.rentPerAccountSol).toBeCloseTo(0.00203928, 6);
    expect(summary.summary.totalRentSol).toBeGreaterThan(0.01);
    expect(summary.summary.netRecoverableSol).toBeGreaterThan(0.01);
  });

  it('should build base64 closeAccount transaction payload for 1-click recovery', () => {
    const txData = buildCloseAccountTransaction(DEMO_SOLANA_WALLET);
    expect(txData.success).toBe(true);
    expect(txData.module).toBe('MODULE_2_SOLANA_RENT_RECOVERY');
    expect(txData.accountsClosedCount).toBe(5);
    expect(txData.grossRentReclaimedSol).toBeGreaterThan(0);
    expect(txData.transactionPayload.serializedTransactionBase64).toBeDefined();
  });
});

describe('MODULE 3: Dust Consolidation Engine', () => {
  it('should detect dust balances below user threshold and offer 4 strategies', () => {
    const report = analyzeDustBalances(DEMO_SOLANA_WALLET, 5.00);
    expect(report.thresholdUsd).toBe(5.00);
    expect(report.totalDustCount).toBeGreaterThan(0);
    expect(report.dustTokens[0].strategies.swap).toBeDefined();
    expect(report.dustTokens[0].strategies.bridge).toBeDefined();
    expect(report.dustTokens[0].strategies.transfer).toBeDefined();
    expect(report.dustTokens[0].strategies.consolidate).toBeDefined();
  });

  it('should build unsigned batch dust consolidation payload', () => {
    const batchData = buildDustConsolidationTransaction(DEMO_SOLANA_WALLET, ['solana_DUST_SHIB'], 'SWAP');
    expect(batchData.success).toBe(true);
    expect(batchData.module).toBe('MODULE_3_DUST_CONSOLIDATION');
    expect(batchData.estimatedNetReclaimedUsd).toBeGreaterThan(0);
    expect(batchData.batchTransactionPayload.rawUnsignedTransactionBase64).toBeDefined();
  });
});

describe('ChainRecover AI Scanner & Module Endpoints', () => {
  it('POST /api/v1/scanner/dust/analyze should return dust analysis with strategies', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/dust/analyze')
      .send({ walletAddress: DEMO_SOLANA_WALLET, thresholdUsd: 10.00 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.thresholdUsd).toBe(10.00);
    expect(res.body.data.totalDustCount).toBeGreaterThan(0);
  });

  it('POST /api/v1/scanner/dust/consolidate should return batch consolidation tx payload', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/dust/consolidate')
      .send({ walletAddress: DEMO_SOLANA_WALLET, strategy: 'SWAP' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.batchTransactionPayload.rawUnsignedTransactionBase64).toBeDefined();
  });

  it('GET /api/v1/scanner/solana/rent/:address should return rent recovery summary', async () => {
    const res = await request(app).get(`/api/v1/scanner/solana/rent/${DEMO_SOLANA_WALLET}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalEmptyAccountsCount).toBe(5);
  });

  it('GET /api/v1/scanner/chains should list supported blockchains', async () => {
    const res = await request(app).get('/api/v1/scanner/chains');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(7);
  });
});
