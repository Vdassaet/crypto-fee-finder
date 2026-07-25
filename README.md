# ChainRecover AI ⚡

> **Production-Ready Multi-Chain Asset Recovery & Fee Optimization SaaS Platform**

[![CI/CD Pipeline](https://github.com/Vdassaet/crypto-fee-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/Vdassaet/crypto-fee-finder/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Security: Non-Custodial](https://img.shields.io/badge/Security-Non--Custodial-emerald.svg)](#security-architecture)

**ChainRecover AI** is an enterprise-grade SaaS web application and REST API platform that scans crypto wallets across **7 blockchains** to discover recoverable assets, reclaim locked Solana SOL rent deposits, consolidate micro-dust balances, claim protocol yield & airdrops, revoke dangerous unlimited token approvals, and optimize gas fee execution windows.

---

## 🔒 NON-NEGOTIABLE SECURITY RULES

1. **Zero Private Key Policy**: ChainRecover AI **NEVER** requests, stores, or accesses private keys or seed phrases (12/24 words).
2. **Client-Side Wallet Signatures Only**: All recovery, account closing, reward harvesting, and approval revocation operations build unsigned transaction payloads requiring explicit EIP-1193 (**MetaMask**, **Coinbase Wallet**) or Solana Wallet Adapter (**Phantom**) signatures on the client.
3. **Pre-Execution Simulation & Drainer Blacklist**: Every payload is verified against global malicious contract drainer blacklists before signing.

---

## 🌐 SUPPORTED BLOCKCHAINS

### Phase 1 (Live Production Support)
- ⚡ **Solana** (SOL / SPL)
- 💎 **Ethereum** (ETH / ERC-20)
- 🔵 **Base** (L2)
- 🔷 **Arbitrum** (L2)
- 🔴 **Optimism** (L2)
- 🟣 **Polygon** (POL)
- 🟡 **BNB Chain** (BSC)

### Phase 2 (Roadmap)
- 🟧 Bitcoin (BTC) • 🔺 Avalanche (AVAX) • 💧 Sui • 🟢 Aptos

---

## 🚀 PLATFORM MODULES ARCHITECTURE

- **Module 1: Multi-Chain Wallet Scanner**: Simultaneous asset & liability detection across 7 chains.
- **Module 2: Solana Rent Recovery Engine**: Detects empty SPL Associated Token Accounts (ATAs) locking 0.00203928 SOL (~$0.37 USD) each. Generates base64 `closeAccount` transaction payload for 1-click refund to owner.
- **Module 3: Dust Consolidation Engine**: Detects micro-balances ($1-$50 USD) and provides 4 strategies (**Swap**, **Bridge**, **Transfer**, **Batch Consolidate**).
- **Module 4: Reward Scanner Engine**: Searches 5 yield categories (**Unclaimed Staking**, **Validator Rewards**, **Liquidity Mining**, **Governance**, **Airdrops**).
- **Module 5: Token Approval Scanner & Revoker**: Flags Unlimited Token Approvals (`MaxUint256`) across 5 EVM chains, assigns risk ratings (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and builds `approve(spender, 0)` revocation calldata.
- **Module 6: Fee Optimizer Engine**: Estimates gas fees, benchmarks high-speed MEV-protected RPC nodes (Flashbots, Helius, Alchemy, QuickNode), recommends low-gwei execution windows, and computes annual USD savings.
- **Module 7: Cross-Chain Merged Unified Dashboard**: Aggregates assets across all 7 chains into a single executive dashboard with percentage allocation bar charts and 1-Click Master Recovery payloads.
- **Module 8: AI Architect Assistant**: Natural Language Engine answering questions like *"What can I recover?"*, *"How much rent do I have?"*, *"Why should I close these accounts?"*, and *"Which wallet is healthiest?"*.
- **Module 9: Analytics Engine & Visual Charts**: Visualizes portfolio allocation, itemized recoverable breakdown, 12-month historical cumulative savings curve, and fees avoided ticker ($945.70 USD saved).
- **Module 10: Business Model & SaaS Monetization Engine**: Supports **Freemium (1 scan/day quota)**, **Premium Pro SaaS ($49/mo)**, **Enterprise API ($199/mo)**, and **10% Performance Success Fee** model on recovered funds.
- **Module 11: Apple-Quality UI & Glassmorphism Design System**: Dark mode glassmorphism UI (`public/index.html`), hover-elevated animated cards, shimmer progress bars, loading skeletons, and multi-tab navigation.
- **Executive Admin Control Panel**: Dedicated dashboard (`public/admin.html`) monitoring Users, Wallets, Scans, Revenue (MRR/ARR), API Usage & RPC Node Health, System Activity Logs, and Error Console.

---

## 🛠️ TECH STACK

- **Frontend**: HTML5, Vanilla JavaScript (ES2024), TailwindCSS, Glassmorphism UI, Custom SVG Charts
- **Backend**: Node.js, Express.js (CommonJS & ES Modules)
- **Database & ORM**: PostgreSQL 16, Prisma ORM
- **Security & Authentication**: JSON Web Tokens (`jsonwebtoken`), `express-rate-limit`, AES-256-GCM Encryption (`crypto`)
- **Blockchain SDKs**: `@solana/web3.js`, `@solana/spl-token`, Ethers.js
- **API Documentation**: OpenAPI 3.0, Swagger UI (`/api-docs`)
- **Containerization & CI/CD**: Docker, Docker Compose, GitHub Actions (`ci.yml`)
- **Testing**: Vitest (`vitest run tests/fees.test.mjs`), Supertest

---

## 📦 QUICK START GUIDE

### 1. Local Installation
```bash
git clone https://github.com/Vdassaet/crypto-fee-finder.git
cd crypto-fee-finder
npm install
```

### 2. Start Application Server
```bash
npm start
```
- 🌐 Web Application Interface: [http://localhost:3000](http://localhost:3000)
- ⚙️ Executive Admin Panel: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
- 📚 OpenAPI Swagger Specs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 3. Run Automated Tests
```bash
npm test
```

---

## 🐳 DOCKER DEPLOYMENT

```bash
docker-compose up -d --build
```

---

## 📑 REST API ENDPOINTS REFERENCE

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/scanner/chains` | `GET` | List all 7 supported blockchains |
| `/api/v1/scanner/cross-chain/merged` | `POST` | Merged multi-chain portfolio report |
| `/api/v1/scanner/solana/rent/:address` | `GET` | Scan empty SPL token accounts & recoverable rent |
| `/api/v1/scanner/solana/build-close-tx` | `POST` | Build unsigned `closeAccount` base64 transaction |
| `/api/v1/scanner/approvals/search` | `POST` | Search active ERC-20 token approvals & risk ratings |
| `/api/v1/scanner/approvals/revoke` | `POST` | Generate `approve(spender, 0)` revocation payload |
| `/api/v1/scanner/ai/chat` | `POST` | Natural Language AI Assistant endpoint |
| `/api/v1/scanner/analytics/report` | `POST` | Portfolio allocation & 12-month savings report |
| `/api/v1/billing/tiers` | `GET` | List SaaS pricing tiers & 10% performance fee model |
| `/api/v1/admin/dashboard` | `GET` | Executive Admin overview metrics |

---

## 📜 LICENSE

MIT License © 2026 ChainRecover AI Platform
