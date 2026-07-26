/**
 * ChainRecover AI - Module 5: Live EVM Approval Scanner & Revoker
 */

const { ethers } = require('ethers');
const { estimateGasCostUsd } = require('./feeCalculator');

const MODULE_5_SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', rpc: 'https://eth.llamarpc.com' },
  { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF', rpc: 'https://base.llamarpc.com' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', color: '#8247E5', rpc: 'https://polygon.llamarpc.com' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0', rpc: 'https://arbitrum.llamarpc.com' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH', color: '#FF0420', rpc: 'https://optimism.llamarpc.com' }
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Common tokens and spenders for live checking without an indexer
const KNOWN_TARGETS = {
  'ethereum': [
    { token: '0xdAC17F958D2ee523a2206206994597C13D831ec7', spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' } // USDT -> Uniswap V2
  ],
  'arbitrum': [
    { token: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', spender: '0xE592427A0AEce92De3Edee1F18E0157C05861564' } // USDC -> Uniswap V3
  ],
  'polygon': [
    { token: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', spender: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff' } // WMATIC -> QuickSwap
  ]
};

function isEvmAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function searchTokenApprovals(walletAddress, targetChain = 'ALL') {
  if (!isEvmAddress(walletAddress)) {
    throw new Error(`Invalid EVM address: ${walletAddress}`);
  }

  let chainsToCheck = targetChain === 'ALL' 
    ? MODULE_5_SUPPORTED_CHAINS 
    : MODULE_5_SUPPORTED_CHAINS.filter(c => c.id.toLowerCase() === targetChain.toLowerCase());

  const liveApprovals = [];

  for (const chain of chainsToCheck) {
    const targets = KNOWN_TARGETS[chain.id];
    if (!targets) continue;

    const provider = new ethers.JsonRpcProvider(chain.rpc);

    for (const target of targets) {
      try {
        const contract = new ethers.Contract(target.token, ERC20_ABI, provider);
        const allowance = await contract.allowance(walletAddress, target.spender);
        
        if (allowance > 0n) {
          const isUnlimited = allowance >= ethers.MaxUint256 / 2n;
          let allowanceFormatted = isUnlimited ? 'Unlimited (MaxUint256)' : ethers.formatUnits(allowance, 6) + ' Tokens';
          
          let riskLevel = isUnlimited ? 'HIGH' : 'LOW';
          if (chain.id === 'ethereum' && isUnlimited) riskLevel = 'CRITICAL';

          liveApprovals.push({
            id: `appr_${chain.id}_${target.token}_${target.spender}`,
            chain: chain.id,
            tokenSymbol: await contract.symbol().catch(()=>'TKN'),
            tokenName: await contract.name().catch(()=>'Unknown Token'),
            tokenAddress: target.token,
            spenderName: 'DEX Router / Contract',
            spenderAddress: target.spender,
            allowanceFormatted,
            isUnlimited,
            riskLevel,
            riskReason: isUnlimited ? 'Unlimited approval granted.' : 'Capped allowance.',
            estimatedRevokeGasUsd: estimateGasCostUsd(chain.id, 45000),
            lastUpdated: new Date().toISOString().split('T')[0]
          });
        }
      } catch (err) {
        console.warn(`Failed to check allowance on ${chain.id}:`, err.message);
      }
    }
  }

  const unlimitedCount = liveApprovals.filter(a => a.isUnlimited).length;
  const criticalCount = liveApprovals.filter(a => a.riskLevel === 'CRITICAL').length;

  return {
    walletAddress,
    scanTimestamp: new Date().toISOString(),
    supportedChains: MODULE_5_SUPPORTED_CHAINS,
    summary: {
      totalApprovalsCount: liveApprovals.length,
      unlimitedApprovalsCount: unlimitedCount,
      criticalRiskCount: criticalCount,
      highRiskCount: liveApprovals.filter(a => a.riskLevel === 'HIGH').length,
      mediumRiskCount: liveApprovals.filter(a => a.riskLevel === 'MEDIUM').length
    },
    approvals: liveApprovals
  };
}

/**
 * MODULE 5: Build Unsigned ERC-20 approve(spender, 0) Revocation Transaction Payload
 */
function buildRevokeTransaction(walletAddress, tokenAddress, spenderAddress, chainId = 'ethereum') {
  if (!walletAddress || !tokenAddress || !spenderAddress) {
    throw new Error('walletAddress, tokenAddress, and spenderAddress are required');
  }

  // Create an interface to encode the approve(spender, 0) calldata
  const iface = new ethers.Interface(ERC20_ABI);
  const calldata = iface.encodeFunctionData("approve", [spenderAddress, 0]);

  return {
    success: true,
    module: 'MODULE_5_LIVE_EVM_APPROVAL_REVOKER',
    walletAddress,
    chain: chainId,
    tokenAddress,
    spenderAddress,
    action: 'REVOKE_ALLOWANCE',
    transactionPayload: {
      to: tokenAddress,
      data: calldata,
      value: '0x0',
      from: walletAddress
    },
    estimatedGasUsd: estimateGasCostUsd(chainId, 45000),
    securityGuarantee: 'Non-custodial zero-allowance transaction. Signature required by MetaMask or Rabby.'
  };
}

module.exports = {
  MODULE_5_SUPPORTED_CHAINS,
  isEvmAddress,
  searchTokenApprovals,
  buildRevokeTransaction
};
