# GafferCard

A match day strategy app for the FIFA World Cup 2026, built on Tether's Wallet Development Kit (WDK) for the Tether Developer Cup.

**Live demo:** https://gaffercard.vercel.app
**Track:** WDK (Wallets)

## What it does

GafferCard lets you use a real, self-custodial crypto wallet to place a small USDT bet on how a real World Cup match will play out. Not who wins, but the style of the game:

- **Park The Bus**: bet the match ends low-scoring (0 or 1 total goals)
- **Gegenpressing**: bet the match ends high-scoring (3 or more total goals)
- **Tiki-Taka**: bet the match ends close and controlled (exactly 2 total goals)

Every bet is a real on-chain transaction. Every result is checked against the real final score of the actual match. Winning bets automatically trigger a real payout back to your wallet.

## How it works

1. **Connect a wallet**: generate a brand new wallet (real seed phrase, real Tron address) or import an existing one. Nothing is custodial, your keys stay in your browser.
2. **See real fixtures**: the app pulls live World Cup 2026 results and upcoming matches from a public sports data API.
3. **Pick a strategy**: choose Park The Bus, Gegenpressing, or Tiki-Taka for the currently targeted match.
4. **Deploy**: 5 USDT leaves your wallet in a real signed transaction on the Tron Shasta testnet.
5. **Get paid automatically**: once the match finishes, the app checks the real result. If you called it right, a payout is sent back to your wallet with no manual steps needed.
6. **Track your record**: every bet is logged in Bet History with a running win/loss count, transaction links, and a share-to-X button.

## Tech stack

- React + Vite
- Tailwind CSS
- [`@tetherto/wdk`](https://wdk.tether.io) and [`@tetherto/wdk-wallet-tron`](https://wdk.tether.io) for wallet creation, key derivation, balance checks, and transfers
- Tron Shasta testnet (via TronGrid)
- [TheSportsDB](https://www.thesportsdb.com) free API for real World Cup fixtures and results

## Third-party services disclosed

- **Wallet and transactions**: Tether's WDK (`@tetherto/wdk`, `@tetherto/wdk-wallet-tron`), running against the public Tron Shasta testnet RPC (`api.shasta.trongrid.io`)
- **Match data**: TheSportsDB, using their shared free-tier API key. No personal data is sent to this API.
- **On-chain history lookups**: TronGrid's public REST API

No API keys, secrets, or paid services are required to run this project.

## Known limitations

- TheSportsDB's free tier caps how many matches can be returned per request. The fixtures list is a rolling window (recent results plus the next few days), not the full tournament calendar.
- Strategy outcomes are judged by total goals only, since the free API doesn't provide deeper stats like possession or shots.
- Penalty shootouts are not counted toward the goal total, only regulation and extra-time goals are.
- The payout vault's seed phrase is stored directly in the app for this testnet demo. This is only acceptable because it holds test funds with zero real value, it is not how a production payout system should be built.
- Bet history and wallet sessions are stored in the browser's local storage, so they are per-device, not synced across devices.

## Running it locally

```bash
git clone https://github.com/Mayahang/gaffercard.git
cd gaffercard
npm install
npm run dev
```

Then open the local URL Vite prints in your terminal.

## Getting testnet funds

To actually deploy a strategy, your wallet needs Shasta testnet TRX (for transaction fees) and USDT. Use the official faucet:

https://shasta.tronex.io/join/getJoinPage

Paste your wallet address (shown in Wallet Settings once connected) to receive test funds.

## Project structure

src/
App.jsx
components/
HeroSection.jsx
LiveMatches.jsx
StrategyDeck.jsx
BetHistory.jsx
OnChainHistory.jsx
TransactionModal.jsx
services/
matchApi.js
strategyEngine.js
oddsEngine.js
tronExplorer.js

## License

MIT (see `LICENSE`)