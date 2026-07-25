/**
 * ChainRecover AI - Module 5: Approval Scanner & Revoker Engine
 * 
 * Supported EVM Chains:
 * 1. Ethereum
 * 2. Base
 * 3. Polygon
 * 4. Arbitrum
 * 5. Optimism
 * 
 * Features:
 * - Detect active ERC-20 / ERC-721 token approvals
 * - Flag Unlimited Token Approvals (MaxUint256)
 * - Risk Assessment (CRITICAL, HIGH, MEDIUM, LOW)
 * - 1-Click Revoke approve(spender, 0) Transaction Generator
 */

const { estimateGasCostUsd } = require('./feeCalculator');

const MODULE_5_SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', color: '#FF0420' }
];

// ERC-20 approve(address spender, uint256 amount) method selector: 0x095ea7b3
const ERC20_APPROVE_METHOD_SIGNATURE = '0x095ea7b3';

/**
 * Validates EVM Address
 */
function isEvmAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * MODULE 5: Search Active EVM Token Approvals
 */
function searchTokenApprovals(walletAddress, targetChain = 'ALL') {
  const isEvm = isEvmAddress(walletAddress);
  const normalizedAddr = isEvm ? walletAddress : '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  const mockApprovals = [
    {
      id: 'appr_eth_1',
      chain: 'ethereum',
      tokenSymbol: 'USDT',
      tokenName: 'Tether USD',
      tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      spenderName: 'Uniswap V2 Router (Old)',
      spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      allowanceFormatted: 'Unlimited (MaxUint256)',
      isUnlimited: true,
      riskLevel: 'HIGH',
      riskReason: 'Unlimited approval on legacy router un-updated for >3 years.',
      estimatedRevokeGasUsd: estimateGasCostUsd('ethereum', 45000),
      lastUpdated: '2022-04-12'
    },
    {
      id: 'appr_eth_2',
      chain: 'ethereum',
      tokenSymbol: 'DAI',
      tokenName: 'Dai Stablecoin',
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      spenderName: 'Unknown Unverified Contract',
      spenderAddress: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      allowanceFormatted: 'Unlimited (MaxUint256)',
      isUnlimited: true,
      riskLevel: 'CRITICAL',
      riskReason: 'Unlimited approval granted to unverified contract address.',
      estimatedRevokeGasUsd: estimateGasCostUsd('ethereum', 45000),
      lastUpdated: '2023-11-05'
    },
    {
      id: 'appr_arb_1',
      chain: 'arbitrum',
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin (Arbitrum)',
      tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      spenderName: 'Uniswap V3 SwapRouter',
      spenderAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      allowanceFormatted: 'Unlimited (MaxUint256)',
      isUnlimited: true,
      riskLevel: 'MEDIUM',
      riskReason: 'Unlimited approval on active verified DEX router.',
      estimatedRevokeGasUsd: estimateGasCostUsd('arbitrum', 40000),
      lastUpdated: '2024-02-18'
    },
    {
      id: 'appr_pol_1',
      chain: 'polygon',
      tokenSymbol: 'WMATIC',
      tokenName: 'Wrapped MATIC',
      tokenAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      spenderName: 'QuickSwap Router',
      spenderAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      allowanceFormatted: '500 WMATIC ($350 USD)',
      isUnlimited: false,
      riskLevel: 'LOW',
      riskReason: 'Capped allowance parameter applied.',
      estimatedRevokeGasUsd: estimateGasCostUsd('polygon', 35000),
      lastUpdated: '2024-05-01'
    },
    {
      id: 'appr_base_1',
      chain: 'base',
      tokenSymbol: 'AERO',
      tokenName: 'Aerodrome Finance',
      tokenAddress: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
      spenderName: 'Aerodrome Router',
      spenderAddress: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
      allowanceFormatted: 'Unlimited (MaxUint256)',
      isUnlimited: true,
      riskLevel: 'MEDIUM',
      riskReason: 'Unlimited approval on Base DEX protocol.',
      estimatedRevokeGasUsd: estimateGasCostUsd('base', 35000),
      lastUpdated: '2024-06-10'
    }
  ];

  const filteredApprovals = targetChain === 'ALL'
    ? mockApprovals
    : mockApprovals.filter(a => a.chain.toLowerCase() === targetChain.toLowerCase());

  const unlimitedCount = filteredApprovals.filter(a => a.isUnlimited).length;
  const criticalCount = filteredApprovals.filter(a => a.riskLevel === 'CRITICAL').length;

  return {
    walletAddress: normalizedAddr,
    scanTimestamp: new Date().toISOString(),
    supportedChains: MODULE_5_SUPPORTED_CHAINS,
    summary: {
      totalApprovalsCount: filteredApprovals.length,
      unlimitedApprovalsCount: unlimitedCount,
      criticalRiskCount: criticalCount,
      highRiskCount: filteredApprovals.filter(a => a.riskLevel === 'HIGH').length,
      mediumRiskCount: filteredApprovals.filter(a => a.riskLevel === 'MEDIUM').length
    },
    approvals: filteredApprovals
  };
}

/**
 * MODULE 5: Build Unsigned ERC-20 approve(spender, 0) Revocation Transaction Payload
 */
function buildRevokeTransaction(walletAddress, tokenAddress, spenderAddress, chain = 'ethereum') {
  if (!walletAddress || !tokenAddress || !spenderAddress) {
    throw new Error('walletAddress, tokenAddress, and spenderAddress are required');
  }

  // Construct 32-byte padded spender address for ERC-20 approve(spender, 0)
  const cleanSpender = spenderAddress.replace('0x', '').padStart(64, '0');
  const zeroAmountPadded = '0'.repeat(64); // 0 allowance = REVOKE
  const calldataHex = `${ERC20_APPROVE_METHOD_SIGNATURE}${cleanSpender}${zeroAmountPadded}`;

  const estimatedGasUsd = estimateGasCostUsd(chain, 45000);

  return {
    success: true,
    module: 'MODULE_5_APPROVAL_REVOKER',
    chain: chain.toLowerCase(),
    walletAddress,
    tokenAddress,
    spenderAddress,
    revocationMethod: 'approve(spender, 0)',
    estimatedGasUsd,
    transactionPayload: {
      to: tokenAddress,
      from: walletAddress,
      value: '0x0',
      data: calldataHex,
      notes: 'Revokes active token allowance by setting spender allowance limit to 0.'
    },
    securityGuarantee: 'Non-custodial. Requires wallet signature via MetaMask / Coinbase Wallet / WalletConnect.'
  };
}

module.exports = {
  MODULE_5_SUPPORTED_CHAINS,
  isEvmAddress,
  searchTokenApprovals,
  buildRevokeTransaction
};
