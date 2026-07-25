# ChainRecover AI & Crypto Fee Finder Platform

![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-v24.18.0-brightgreen) ![Coverage](https://img.shields.io/badge/tests-12%20passed-success) ![Chains](https://img.shields.io/badge/chains-Solana%20%7C%20Ethereum%20%7C%20Base%20%7C%20Arbitrum%20%7C%20Optimism%20%7C%20Polygon%20%7C%20BNB-purple)

**ChainRecover AI** is a production-ready, non-custodial SaaS web application and REST API designed to scan multi-chain crypto wallets, discover recoverable assets (unclosed SPL token account rent deposits, dust balances, claimable protocol yield), and optimize transaction, swap, and cross-chain bridge fees.

---

## 🔒 Security Architecture (Non-Negotiable Guarantee)

- **Zero Private Key Access**: The application reads public RPC chain data only.
- **Client-Side Signature Execution**: All recovery operations (closing SPL accounts, claiming yield, consolidating dust) produce unsigned transaction payloads that must be explicitly reviewed and signed inside the user's wallet (Phantom, MetaMask, Coinbase Wallet, Solflare).

---

## ⚡ Supported Blockchains (Phase 1)

1. **Solana** (SOL / SPL Tokens)
2. **Ethereum** (ETH / ERC-20)
3. **Base** (L2)
4. **Arbitrum** (L2)
5. **Optimism** (L2)
6. **Polygon** (PoS)
7. **BNB Chain** (BSC)

*Future Expansion: Bitcoin, Avalanche, Sui, Aptos.*

---

## 🛠️ Features

### Executive SaaS Dashboard
- **Total Portfolio Value**: Real-time valuation across 7 supported chains.
- **Estimated Recoverable Value**: Consolidated sum of reclaimable rent + unclaimed rewards + dust assets.
- **Solana Rent Reclaimer (Module 1)**: Detects zero-balance/abandoned token accounts and closes them to refund **~0.002039 SOL per account** directly to the user's wallet.
- **Protocol Yield Harvester**: Scans Uniswap V3, Aave V3, Curve, and Liquid Staking pools for uncollected rewards.
- **Wallet Health & Gas Optimization Score**: Measures transaction gas efficiency and flags unrevoked approvals.

### Cross-Chain Fee Finder Engine
- Real-time gas price metrics across EVM & non-EVM networks.
- Route comparison across DEXs (Uniswap V2/V3, PancakeSwap, Curve) and Bridges (Stargate, Hop, Synapse, Arbitrum/Polygon Canonical Bridges).
- Ranks execution paths by total fee (Gas + Protocol Fee + Slippage) and net received output.

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/Vdassaet/crypto-fee-finder.git
cd crypto-fee-finder
npm install
```

### 2. Run Tests

```bash
npm test
```

### 3. Start Development Server

```bash
npm start
```

Open `http://localhost:3000` in your web browser to access the **ChainRecover AI** dashboard!

---

## 📚 API Endpoint Reference

Interactive OpenAPI / Swagger UI documentation is available at `http://localhost:3000/api-docs`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/scanner/chains` | List all supported blockchains |
| `GET` | `/api/v1/scanner/wallet/:address` | Deep scan wallet address across 7 chains |
| `POST` | `/api/v1/scanner/recover` | Prepare unsigned transaction payload for 1-click recovery |
| `GET` | `/api/v1/fees/gas` | Get gas metrics across supported networks |
| `GET` | `/api/v1/fees/defi` | Query DEX swap & lending fee structures |
| `GET` | `/api/v1/fees/bridges` | Query cross-chain bridge fee details |
| `POST` | `/api/v1/fees/compare` | Compare transfer routes and rank by lowest total fee |

---

## 🌐 Synchronized Repository

- **GitHub Repository**: [https://github.com/Vdassaet/crypto-fee-finder.git](https://github.com/Vdassaet/crypto-fee-finder.git)
