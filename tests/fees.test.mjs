import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { getGasMetrics } from '../src/services/feeCalculator.js';
import { calculateDefiFee } from '../src/services/defiService.js';
import { getAvailableBridges, calculateBridgeFee } from '../src/services/bridgeService.js';

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

describe('Crypto Fee Finder API Endpoints', () => {
  it('GET / should return API info and endpoints', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Crypto Fee Finder API');
    expect(res.body.status).toBe('online');
  });

  it('GET /api/v1/fees/gas should return gas metrics', async () => {
    const res = await request(app).get('/api/v1/fees/gas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ethereum).toBeDefined();
  });

  it('GET /api/v1/fees/defi should return list of DeFi protocols', async () => {
    const res = await request(app).get('/api/v1/fees/defi');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('GET /api/v1/fees/bridges should return cross-chain bridge options', async () => {
    const res = await request(app).get('/api/v1/fees/bridges?sourceChain=ethereum&destinationChain=arbitrum');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
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

    const routes = res.body.data.routes;
    for (let i = 0; i < routes.length - 1; i++) {
      expect(routes[i].totalFeeUsd).toBeLessThanOrEqual(routes[i + 1].totalFeeUsd);
    }
  });

  it('POST /api/v1/fees/compare should fail cleanly with 400 when missing params', async () => {
    const res = await request(app)
      .post('/api/v1/fees/compare')
      .send({ sourceChain: 'ethereum' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });
});
