# CopyTrade — Social Copy-Trading on Initia

A social copy-trading platform built as an Initia MiniEVM appchain. Top traders execute strategies on-chain, followers auto-mirror their trades through copy vaults with session key signing.

## Architecture

```
Initia L1 (initiation-2)
  ├── .init Usernames (trader identity)
  └── Interwoven Bridge (cross-chain deposits)
         │
Our MiniEVM Rollup (copytrade-1)
  ├── SimpleAMM        — Constant product DEX (USDC/WINIT, WETH/WINIT)
  ├── CopyTradeRouter   — Leader trades + auto follower mirroring + fee collection
  └── Frontend          — React + wagmi + InterwovenKit
```

## Key Features

- **Leader Trading**: Registered traders execute swaps; all followers' positions auto-mirror proportionally
- **Auto-Signing**: Session keys via InterwovenKit eliminate per-trade wallet popups for followers
- **.init Usernames**: On-chain trader identity, reputation, and social graph
- **Interwoven Bridge**: Deposit from any Initia rollup or L1
- **Revenue Capture**: Platform fees (0.3% on copy trades) + appchain gas revenue

## Initia Native Features

| Feature | Integration |
|---|---|
| Auto-signing | `enableAutoSign` on `/minievm.evm.v1.MsgCall` for frictionless copy-trade execution |
| .init Usernames | Trader identity system — register with `.init` name, displayed on leaderboard |
| Interwoven Bridge | `openBridge()` for cross-chain asset deposits into the rollup |
| InterwovenKit | Wallet connection, transaction signing, chain detection |

## Tech Stack

- **Contracts**: Solidity 0.8.20, Foundry
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS 4, wagmi/viem, recharts
- **Infra**: Initia MiniEVM rollup via Weave CLI, deployed on VPS

## Quick Start

### Contracts

```bash
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --legacy --private-key $PRIVATE_KEY
```

### Frontend

```bash
cd frontend
cp .env.example .env  # fill in contract addresses
npm install
npm run dev
```

### Rollup (requires Weave CLI)

```bash
weave rollup launch  # interactive setup for MiniEVM
```

## Scoring Alignment

| Criteria | Weight | Our Approach |
|---|---|---|
| Originality & Track Fit | 20% | Only social copy-trading platform; novel use of .init as trader identity |
| Technical Execution & Initia Integration | 30% | All 3 native features integrated; own appchain with revenue capture |
| Product Value & UX | 20% | Analytics dashboard with PnL visualization; auto-sign for seamless UX |
| Working Demo & Completeness | 20% | End-to-end: register → follow → trade → copy → withdraw |
| Market Understanding | 10% | Proven model (eToro, Bitget Copy); clear DeFi target user |
