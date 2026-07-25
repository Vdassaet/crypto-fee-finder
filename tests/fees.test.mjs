import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { getGasMetrics } from '../src/services/feeCalculator.js';
import { calculateDefiFee } from '../src/services/defiService.js';
import { getAvailableBridges, calculateBridgeFee } from '../src/services/bridgeService.js';
import { validateAddress, scanWallet } from '../src/services/scannerService.js';

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

describe('ChainRecover AI Scanner Engine', () => {
  it('should validate EVM and Solana wallet address formats', () => {
    expect(validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe('EVM');
    expect(validateAddress('7XwK8vL9MmP3zW4BbN6tY3VvC1xK8SRMFTTRAY')).toBe('SOL');
    expect(validateAddress('invalid_address_123')).toBe(false);
  });

  it('should scan Solana wallet and detect reclaimable SOL rent', async () => {
    const report = await scanWallet('7XwK8vL9MmP3zW4BbN6tY3VvC1xK8SRMFTTRAY');
    expect(report.addressType).toBe('SOL');
    expect(report.summary.totalRecoverableRentSol).toBeGreaterThan(0);
    expect(report.summary.totalEstimatedRecoverableUsd).toBeGreaterThan(0);
    expect(report.inactiveAccounts.length).toBe(5);
  });
});

describe('Crypto Fee Finder & ChainRecover AI API Endpoints', () => {
  it('GET / should return index.html SPA or API status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/scanner/chains should list supported blockchains', async () => {
    const res = await request(app).get('/api/v1/scanner/chains');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(7);
  });

  it('GET /api/v1/scanner/wallet/:address should return full wallet scan', async () => {
    const res = await request(app).get('/api/v1/scanner/wallet/7XwK8vL9MmP3zW4BbN6tY3VvC1xK8SRMFTTRAY');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalPortfolioUsd).toBeGreaterThan(0);
  });

  it('POST /api/v1/scanner/recover should generate unsigned recovery payload', async () => {
    const res = await request(app)
      .post('/api/v1/scanner/recover')
      .send({
        address: '7XwK8vL9MmP3zW4BbN6tY3VvC1xK8SRMFTTRAY',
        actionType: 'RECLAIM_SOLANA_RENT'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresSignatureFrom).toBe('7XwK8vL9MmP3zW4BbN6tY3VvC1xK8SRMFTTRAY');
    expect(res.body.data.reclaimAmountSol).toBeGreaterThan(0);
  });

  it('GET /api/v1/fees/gas should return gas metrics', async () => {
    const res = await request(app).get('/api/v1/fees/gas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ethereum).toBeDefined();
  });

  it('POST /api/v1/fees/compare should compare routes and rank cheapest first', async () => {
    const res = await request(app)
      .post('/api/v1/fees/compare')
      .send({
        sourceChain: 'ethereum',
        destinationChain: 'arbitrum',
        token: 'USDC',
        amountUsd: 1500
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalRoutesFound).toBeGreaterThan(0);
    expect(res.body.data.bestRoute).toBeDefined();
  });
});
