<div align="center">

<img src="https://img.shields.io/badge/Solana-black?style=for-the-badge&logo=solana&logoColor=9945FF" alt="Solana" />
<img src="https://img.shields.io/badge/Anchor-black?style=for-the-badge&logo=anchor&logoColor=white" alt="Anchor" />
<img src="https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/TypeScript-black?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript" />
<img src="https://img.shields.io/badge/Rust-black?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
<img src="https://img.shields.io/badge/TailwindCSS-black?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4" alt="Tailwind" />
<img src="https://img.shields.io/badge/Prisma-black?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
<img src="https://img.shields.io/badge/pnpm-black?style=for-the-badge&logo=pnpm&logoColor=F69220" alt="pnpm" />

<br /><br />

# 🏛️ Auto Prop Firm

### The World's First Fully Autonomous Proprietary Trading Firm — Powered by Crypto & Smart Contracts

<br />

<p align="center">
  <strong>A production-grade, open-source prop firm shell</strong> that connects to the
  <a href="https://propsim.markets"><strong>PropSim.Markets</strong></a>
  trading engine via API — enabling fully autonomous challenge evaluation, funded account management, and on-chain USDC payouts through a custom Solana vault program.
</p>

<br />

<img src="https://img.shields.io/badge/status-alpha-orange?style=flat-square" alt="Status" />
<img src="https://img.shields.io/github/license/dylanpersonguy/auto-prop-firm?style=flat-square&color=blue" alt="License" />
<img src="https://img.shields.io/badge/solana-devnet-9945FF?style=flat-square" alt="Solana Devnet" />
<img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square" alt="Node" />
<img src="https://img.shields.io/badge/pnpm-%3E%3D9-F69220?style=flat-square" alt="pnpm" />

</div>

---

<br />

## ✨ What Is This?

**Auto Prop Firm** is a complete, open-source proprietary trading firm shell. Unlike traditional prop firms that require enormous back-office infrastructure, this system is **fully autonomous** — all challenge evaluation, account provisioning, profit tracking, and payouts are handled programmatically through smart contracts and API integrations.

> **💡 Think of it this way:** You bring the brand. PropSim.Markets brings the engine. This shell connects them into a real, operational prop firm.

### How It Works

```
┌─────────────────┐      API       ┌──────────────────────┐
│   Auto Prop Firm │ ◄──────────► │  PropSim.Markets API  │
│   (This Repo)    │               │  (Trading Engine)     │
│                  │               │                       │
│  • Next.js Shell │               │  • Account Creation   │
│  • Admin Panel   │               │  • Challenge Engine   │
│  • Trading UI    │               │  • Market Data Feed   │
│  • Referral Sys  │               │  • Trade Execution    │
│  • Payout Claims │               │  • P&L Tracking       │
└────────┬─────────┘               └───────────────────────┘
         │
         │  On-Chain
         ▼
┌──────────────────────┐
│  Solana Vault Program │
│  (Anchor / Rust)      │
│                       │
│  • USDC Deposits      │
│  • Ed25519 Claims     │
│  • Daily Cap Limits   │
│  • Treasury Mgmt      │
└───────────────────────┘
```

### Key Concept

This project is **open source** and anyone can use it. However, to generate trading accounts, run challenges, access the trading engine, and execute trades, **you will need to use the official [PropSim.Markets API](https://propsim.markets)**. The shell handles everything else — the UI, payout infrastructure, referral tracking, admin management, and on-chain vault operations.

<br />

---

## 🚀 Features

### 🎯 Trading Terminal
- **Professional candlestick charts** via `lightweight-charts` v5 with dark theme
- **Real-time order management** — market, limit, stop-loss, take-profit
- **Live P&L tracking** with open positions and trade history
- **Account overview** — balance, equity, drawdown, profit targets
- **Multi-timeframe support** — 1m, 5m, 15m, 1H, 4H, 1D

### 🛡️ Admin Dashboard
- **JWT-authenticated** admin panel at `/admin`
- **User management** — view, search, edit, manage all traders
- **Challenge oversight** — monitor active challenges and evaluations
- **Payout processing** — approve/reject payout claims
- **Deposit tracking** — all on-chain deposits with Solana signatures
- **Commission management** — referral commission payouts
- **Platform analytics** — real-time stats and KPIs

### 💰 On-Chain USDC Vault (Solana)
- **Custom Anchor program** for trustless USDC payouts
- **Ed25519 signature verification** — claims signed server-side, validated on-chain
- **Daily cap enforcement** — configurable daily payout limits
- **PDA-derived vaults** — deterministic vault addresses per trader
- **Treasury management** — separate treasury and profit wallets

### 🤝 Referral & Commission System
- **Unique referral codes** for every user
- **15% commission** on referred user deposits
- **Automatic tracking** — commissions calculated on-chain deposit events
- **Withdrawal system** — referrers can claim commissions as signed payout claims
- **21 passing tests** — fully tested referral logic

### 🔐 Security
- **BFF architecture** — PropSim API keys never exposed to the browser
- **Ed25519 signed payouts** — cryptographic proof for every claim
- **JWT admin auth** — secure admin panel with `jose` library
- **Zod validation** — all API inputs/outputs validated with schemas
- **Idempotency keys** — prevent duplicate transactions

<br />

---

## 🏗️ Architecture

```
auto-prop-firm/
├── programs/
│   └── propsim_vault/          # 🦀 Anchor (Rust) — Solana on-chain vault program
│       └── src/lib.rs          #    initialize_config, set_signer, redeem_claim
│
├── packages/
│   └── vault-sdk/              # 📦 TypeScript SDK for the vault program
│       └── src/                #    PDA derivation, IX builders, Ed25519 helpers
│
├── apps/
│   └── shell/                  # ⚡ Next.js 14 App Router — the main application
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/        #    ~30+ BFF proxy routes (Next.js Route Handlers)
│       │   │   ├── admin/      #    7 admin dashboard pages
│       │   │   ├── dashboard/  #    Trader dashboard
│       │   │   ├── trading/    #    Trading terminal
│       │   │   └── cashier/    #    Deposit & withdrawal
│       │   ├── components/
│       │   │   ├── trading/    #    14 trading UI components
│       │   │   ├── admin/      #    Admin UI components
│       │   │   └── ui/         #    Shared design system
│       │   └── lib/
│       │       ├── api.ts      #    Typed API client with Zod validation
│       │       ├── hooks.ts    #    ~30+ TanStack Query hooks
│       │       ├── schemas.ts  #    Zod schemas for all API types
│       │       ├── propsim.ts  #    Server-side PropSim API client
│       │       └── referral.ts #    Referral commission logic
│       └── prisma/
│           └── schema.prisma   #    User, Referral, Payout, Deposit models
│
├── scripts/                    # 🔧 Deployment & setup scripts
├── tests/                      # ✅ Vault + referral tests
├── turbo.json                  # ⚙️  Turborepo pipeline config
└── package.json                # 📋 pnpm workspace root
```

<br />

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contract** | Rust, Anchor | On-chain USDC vault with Ed25519 claim verification |
| **Vault SDK** | TypeScript | PDA derivation, instruction builders, signature helpers |
| **Frontend** | Next.js 14, React 18 | App Router, Server Components, BFF API routes |
| **Styling** | Tailwind CSS | Dark theme, responsive, utility-first |
| **Charts** | lightweight-charts v5 | Professional candlestick & volume charts |
| **Data Fetching** | TanStack Query | Caching, auto-refetch, optimistic updates |
| **Validation** | Zod | Runtime type safety for all API boundaries |
| **Auth** | jose (JWT) | Admin authentication & session management |
| **Database** | Prisma + SQLite | User, referral, payout, deposit tracking |
| **Blockchain** | Solana (Devnet) | USDC deposits, vault management, claim redemption |
| **Monorepo** | pnpm Workspaces + Turborepo | Build orchestration, dependency management |

<br />

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 — `npm i -g pnpm`
- **Rust** + **Anchor CLI** — [Install Guide](https://www.anchor-lang.com/docs/installation)
- **Solana CLI** — [Install Guide](https://docs.solana.com/cli/install-solana-cli-tools)

### 1. Clone & Install

```bash
git clone https://github.com/dylanpersonguy/auto-prop-firm.git
cd auto-prop-firm
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
cp apps/shell/.env.example apps/shell/.env
```

Edit `apps/shell/.env` with your configuration:

```env
# PropSim.Markets API
PROPSIM_BASE_URL=https://api.propsim.markets
PROPSIM_API_KEY=your_api_key_here

# Admin Auth
PROPSIM_SHELL_JWT_SECRET=your_jwt_secret_here

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
USDC_MINT=your_usdc_mint_address
TREASURY_WALLET=your_treasury_wallet
PROFIT_WALLET=your_profit_wallet

# Vault Program
VAULT_PROGRAM_ID=VLT111111111111111111111111111111111111111
VAULT_CONFIG_PDA=your_vault_config_pda
VAULT_USDC_TOKEN_ACCOUNT=your_vault_usdc_account

# Payout Claims
PROPSIM_CLAIM_SIGNER_ED25519_PRIVATE_KEY_BASE64=your_signer_key
CLAIM_DOMAIN=propsim.markets
CLAIM_TTL_SECONDS=300
DAILY_CAP_USDC=50000
```

### 3. Database Setup

```bash
pnpm db:push
```

### 4. Run Development Server

```bash
pnpm dev
```

The shell will be available at **http://localhost:3001**.

### 5. (Optional) Deploy Vault Program

```bash
# Build the Anchor program
pnpm vault:build

# Deploy to Solana devnet
pnpm vault:deploy

# Initialize vault configuration
npx ts-node scripts/setup-vault.ts
```

<br />

---

## 🗄️ Database Schema

```prisma
model User {
  id             String    @id @default(cuid())
  wallet         String    @unique
  referralCode   String    @unique
  referredBy     String?
  role           Role      @default(USER)     // USER | ADMIN
  createdAt      DateTime  @default(now())
}

model ReferralCommission {
  id             String    @id @default(cuid())
  referrerWallet String                        // Who earns the commission
  depositAmount  Float                         // Original deposit (USDC)
  commission     Float                         // 15% of deposit
  txSignature    String    @unique             // Solana tx signature
}

model PayoutClaim {
  id             String    @id @default(cuid())
  wallet         String
  amountLamports BigInt                        // USDC lamports (6 decimals)
  nonce          String    @unique
  signature      String                        // Ed25519 signature (base64)
  redeemed       Boolean   @default(false)
  redeemedTx     String?                       // Solana redemption tx
}

model DepositReceipt {
  id             String    @id @default(cuid())
  wallet         String
  amountLamports BigInt
  txSignature    String    @unique
  confirmedAt    DateTime  @default(now())
}
```

<br />

---

## 🔑 API Routes

The shell exposes **~30+ BFF (Backend-for-Frontend) routes** that proxy to PropSim.Markets API, keeping all secrets server-side:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Admin JWT login |
| `/api/accounts` | GET | List trading accounts |
| `/api/accounts/[id]` | GET | Account details |
| `/api/challenges` | GET/POST | List & create challenges |
| `/api/challenges/[id]` | GET | Challenge details |
| `/api/trades` | GET/POST | Trade history & execution |
| `/api/trades/[id]/close` | POST | Close open position |
| `/api/orders` | GET/POST | Order management |
| `/api/orders/[id]/cancel` | POST | Cancel pending order |
| `/api/positions` | GET | Open positions |
| `/api/market-data/candles` | GET | OHLCV candlestick data |
| `/api/market-data/symbols` | GET | Available trading symbols |
| `/api/market-data/tick` | GET | Latest tick/price data |
| `/api/cashier/deposit` | POST | Record USDC deposit |
| `/api/cashier/payout/sign` | POST | Sign payout claim (Ed25519) |
| `/api/referral/[wallet]` | GET | Referral stats & commissions |
| `/api/referral/withdraw` | POST | Withdraw referral commissions |
| `/api/admin/users` | GET | Admin: list all users |
| `/api/admin/stats` | GET | Admin: platform stats |
| `/api/admin/payouts` | GET/PATCH | Admin: manage payouts |
| `/api/admin/deposits` | GET | Admin: deposit history |
| `/api/admin/commissions` | GET | Admin: commission overview |

<br />

---

## 🔄 Payout Flow

```
Trader requests payout ──► BFF signs Ed25519 claim ──► Client builds Solana TX
                                                              │
                    ┌─────────────────────────────────────────┘
                    ▼
         ┌─────────────────────┐
         │  Solana Transaction  │
         │                     │
         │  ix[0]: Ed25519     │
         │         verify      │
         │                     │
         │  ix[1]: redeem_claim│
         │         (vault pgm) │
         └─────────┬───────────┘
                   │
                   ▼
         USDC transferred to trader wallet
         ClaimMarker PDA created (replay-proof)
```

### Non-Negotiable Invariants

1. **NO double payouts** — claim replay-proof via ClaimMarker PDA
2. **Deterministic encoding** — same inputs = same bytes (Borsh)
3. **Trading logic stays off-chain** — PropSim engine only
4. **Vault authority is PDA-only** — no private key
5. **Admin gated** — authority required for config changes
6. **Server key never exposed** — Ed25519 signing is server-only
7. **BFF proxy** — browser never calls PropSim directly

<br />

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run vault program tests (requires Solana localnet)
pnpm test:vault

# Run referral system tests
cd apps/shell && npx jest --testPathPattern=referral
```

<br />

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run test suite |
| `pnpm vault:build` | Build the Anchor program |
| `pnpm vault:deploy` | Deploy vault to Solana |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm solana:localnet` | Start Solana local validator |
| `pnpm usdc:mint` | Mint test USDC tokens |

<br />

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

<br />

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

<br />

---

<div align="center">

**Built with ❤️ by the PropSim.Markets community**

<br />

<a href="https://propsim.markets">Website</a> · <a href="https://github.com/dylanpersonguy/auto-prop-firm/issues">Report Bug</a> · <a href="https://github.com/dylanpersonguy/auto-prop-firm/issues">Request Feature</a>

</div>
