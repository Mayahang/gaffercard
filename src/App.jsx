import React, { useState, useEffect } from 'react';
import HeroSection from './components/HeroSection';
import StrategyDeck from './components/StrategyDeck';
import LiveMatches from './components/LiveMatches';
import BetHistory from './components/BetHistory';
import OnChainHistory from './components/OnChainHistory';
import TransactionModal from './components/TransactionModal';
import WDK from '@tetherto/wdk';
import WalletManagerTron from '@tetherto/wdk-wallet-tron';
import { evaluateStrategy } from './services/strategyEngine';
import { verifyTransactionConfirmed } from './services/tronExplorer';
import { fetchEventById } from './services/matchApi';

const TRON_PROVIDER = 'https://api.shasta.trongrid.io';
const USDT_SHASTA_CONTRACT = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
const VAULT_ADDRESS = 'TQ4zbNDT13RJ3PYNGctS841tBTo5HijaM7';
const VAULT_MNEMONIC = import.meta.env.VITE_VAULT_MNEMONIC;
const FAUCET_URL = 'https://shasta.tronex.io/join/getJoinPage';

if (!VAULT_MNEMONIC) {
  console.error('Missing VITE_VAULT_MNEMONIC. Set it in your .env file (local) or in your Vercel project env vars, then rebuild.');
}

const STRATEGY_LABELS = {
  park_the_bus: 'Park The Bus',
  gegenpressing: 'Gegenpressing',
  tiki_taka: 'Tiki-Taka',
};

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [txResult, setTxResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  const [modalMode, setModalMode] = useState('create');
  const [inputMnemonic, setInputMnemonic] = useState('');
  const playSound = (soundFile) => {
  const audio = new Audio(soundFile);
  audio.volume = 0.4;
  audio.play();
};

  const [activeMatch, setActiveMatch] = useState({
    id: 101,
    homeTeam: "Real Madrid",
    awayTeam: "Manchester City",
    homeFlag: "🇪🇸",
    awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    status: "LIVE - 64'",
    score: "2 - 2",
    competition: "UEFA Champions League",
    venue: "Santiago Bernabéu"
  });

  const [betHistory, setBetHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gaffercard_bet_history')) || [];
    } catch {
      return [];
    }
  });

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 16)}...${addr.slice(-6)}`;
  };

  const fetchUsdtBalance = async (account) => {
    try {
      const raw = await account.getTokenBalance(USDT_SHASTA_CONTRACT);
      return (Number(raw) / 1e6).toFixed(2);
    } catch (err) {
      console.warn('Balance check failed (address may be unactivated on Shasta):', err);
      return '0.00';
    }
  };

  useEffect(() => {
    const savedMnemonic = localStorage.getItem('gaffercard_mnemonic');
    if (!savedMnemonic) return;

    (async () => {
      try {
        const walletManager = new WalletManagerTron(savedMnemonic, { provider: TRON_PROVIDER });
        const account = await walletManager.getAccount(0);
        const address = await account.getAddress();
        const balance = await fetchUsdtBalance(account);
        setWallet({ address, mnemonic: savedMnemonic, balance });
      } catch (err) {
        console.error('Failed to restore saved wallet:', err);
        localStorage.removeItem('gaffercard_mnemonic');
      }
    })();
  }, []);

  const handleLaunchTetherWdk = async () => {
  playSound('/sounds/click.mp3');
    setLoading(true);
    try {
      const seedPhrase = WDK.getRandomSeedPhrase();
      const walletManager = new WalletManagerTron(seedPhrase, { provider: TRON_PROVIDER });
      const account = await walletManager.getAccount(0);
      const address = await account.getAddress();

      setWallet({ address, mnemonic: seedPhrase, balance: '0.00' });
      localStorage.setItem('gaffercard_mnemonic', seedPhrase);
    } catch (err) {
      console.error('WDK wallet creation failed:', err);
      alert('Could not create wallet. Check the console for details.');
    } finally {
      setIsModalOpen(false);
      setLoading(false);
    }
  };

  const handleImportWallet = async (e) => {
    e.preventDefault();
    const cleanPhrase = inputMnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
    const words = cleanPhrase.split(' ');

    if (words.length !== 12 && words.length !== 24) {
      alert("Invalid seed phrase structure. Must be exactly 12 or 24 words.");
      return;
    }

    setLoading(true);
    try {
      const walletManager = new WalletManagerTron(cleanPhrase, { provider: TRON_PROVIDER });
      const account = await walletManager.getAccount(0);
      const address = await account.getAddress();
      const balance = await fetchUsdtBalance(account);

      setWallet({ address, mnemonic: cleanPhrase, balance });
      localStorage.setItem('gaffercard_mnemonic', cleanPhrase);
    } catch (err) {
      console.error('WDK wallet import failed:', err);
      alert('Could not derive a wallet from that phrase. Double check it and try again.');
    } finally {
      setIsModalOpen(false);
      setLoading(false);
      setInputMnemonic('');
    }
  };

  const refreshLiveBalance = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const walletManager = new WalletManagerTron(wallet.mnemonic, { provider: TRON_PROVIDER });
      const account = await walletManager.getAccount(0);
      const balance = await fetchUsdtBalance(account);
      setWallet(prev => (prev ? { ...prev, balance } : null));
    } catch (err) {
      console.error('Balance refresh failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployStrategy = async (strategyId, multiplier) => {
  playSound('/sounds/whistle.mp3');
    if (!wallet) {
      alert("Please connect your Tether wallet before deploying a strategy configuration!");
      return;
    }
    if (parseFloat(wallet.balance) < 5) {
      alert("Insufficient Balance! Open wallet settings to claim from the faucet.");
      return;
    }

    setLoading(true);
    try {
      const walletManager = new WalletManagerTron(wallet.mnemonic, { provider: TRON_PROVIDER });
      const account = await walletManager.getAccount(0);

      const result = await account.transfer({
        token: USDT_SHASTA_CONTRACT,
        recipient: VAULT_ADDRESS,
        amount: 5000000,
      });

const outcome = evaluateStrategy(strategyId, activeMatch);
if (outcome.hit) {
  playSound('/sounds/cheer.mp3');
}

let payoutHash = null;
let resultText;

if (!outcome.settled) {
  resultText = `Result pending, ${activeMatch.homeTeam} vs ${activeMatch.awayTeam} hasn't finished yet.`;
} else if (outcome.hit) {
  const payoutAmount = Math.round(5 * parseFloat(multiplier) * 1e6); // in base units
  try {
    const vaultManager = new WalletManagerTron(VAULT_MNEMONIC, { provider: TRON_PROVIDER });
    const vaultAccount = await vaultManager.getAccount(0);
    const payoutResult = await vaultAccount.transfer({
      token: USDT_SHASTA_CONTRACT,
      recipient: wallet.address,
      amount: payoutAmount,
    });
    const confirmed = await verifyTransactionConfirmed(payoutResult.hash);
    if (confirmed) {
      payoutHash = payoutResult.hash;
      resultText = `✅ Strategy HIT! ${outcome.reason}\n\nPayout of ${(payoutAmount / 1e6).toFixed(2)} USDT confirmed on-chain.`;
    } else {
      resultText = `✅ Strategy HIT! ${outcome.reason}\n\n(Payout broadcast but not confirmed, vault may be low on TRX/USDT. Please check back or top up the vault.)`;
    }
    
  } catch (payoutErr) {
    console.error('Payout transfer failed:', payoutErr);
    resultText = `✅ Strategy HIT! ${outcome.reason}\n\n(Payout failed, vault may be low on funds, check console.)`;
  }
} else {
  resultText = `❌ Strategy missed. ${outcome.reason}`;
}

const newBet = {
  id: result.hash,
  txHash: result.hash,
  payoutHash: payoutHash,
  walletAddress: wallet.address,
  matchId: activeMatch.id,
  matchLabel: `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`,
  strategyId: strategyId,
  strategyLabel: STRATEGY_LABELS[strategyId] || strategyId,
  multiplier: multiplier || null,
  hit: outcome.settled ? outcome.hit : null,
};
      setBetHistory(prev => {
        const updated = [...prev, newBet];
        localStorage.setItem('gaffercard_bet_history', JSON.stringify(updated));
        return updated;
      });

      setTxResult({
  matchLabel: `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`,
  strategyLabel: STRATEGY_LABELS[strategyId] || strategyId,
  multiplier,
  txHash: result.hash,
  resultText,
  hit: outcome.settled ? outcome.hit : null,
});

      const balance = await fetchUsdtBalance(account);
      setWallet(prev => (prev ? { ...prev, balance } : null));
    } catch (err) {
      console.error('Strategy deploy transaction failed:', err);
      alert('Transaction failed. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };
const handleMatchesLoaded = async () => {
  setBetHistory(prev => {
    const pendingBets = prev.filter(b => b.hit === null);
    if (pendingBets.length === 0) return prev;

    (async () => {
      const resolved = await Promise.all(
        pendingBets.map(async (bet) => {
          const freshMatch = await fetchEventById(bet.matchId);
          if (!freshMatch) return null;
          const outcome = evaluateStrategy(bet.strategyId, freshMatch);
          if (!outcome.settled) return null;

          let payoutHash = null;
          if (outcome.hit) {
            try {
              const vaultManager = new WalletManagerTron(VAULT_MNEMONIC, { provider: TRON_PROVIDER });
              const vaultAccount = await vaultManager.getAccount(0);
              const payoutAmount = Math.round(5 * parseFloat(bet.multiplier || 2) * 1e6);
              const payoutResult = await vaultAccount.transfer({
                token: USDT_SHASTA_CONTRACT,
                recipient: bet.walletAddress,
                amount: payoutAmount,
              });
              const confirmed = await verifyTransactionConfirmed(payoutResult.hash);
              payoutHash = confirmed ? payoutResult.hash : null;
            } catch (payoutErr) {
              console.error('Delayed payout failed:', payoutErr);
            }
          }

          return { id: bet.id, hit: outcome.hit, payoutHash };
        })
      );

      const resolvedMap = new Map(
        resolved.filter(Boolean).map(r => [r.id, r])
      );

      if (resolvedMap.size === 0) return;

      setBetHistory(current => {
        const updated = current.map(b => {
          if (!resolvedMap.has(b.id)) return b;
          const r = resolvedMap.get(b.id);
          return { ...b, hit: r.hit, payoutHash: r.payoutHash || b.payoutHash };
        });
        localStorage.setItem('gaffercard_bet_history', JSON.stringify(updated));
        return updated;
      });

      // Refresh displayed balance in case a delayed payout just landed
      if (wallet) {
        try {
          const walletManager = new WalletManagerTron(wallet.mnemonic, { provider: TRON_PROVIDER });
          const account = await walletManager.getAccount(0);
          const balance = await fetchUsdtBalance(account);
          setWallet(w => (w ? { ...w, balance } : null));
        } catch (err) {
          console.warn('Post-payout balance refresh failed:', err);
        }
      }
    })();

    return prev;
  });
};
  const handleClearHistory = () => {
    localStorage.removeItem('gaffercard_bet_history');
    setBetHistory([]);
  };

  return (
  <>
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-80"
      >
        <source src="/stadium.mp4" type="video/mp4" />
      </video>
	    {/* <div className="absolute inset-0 bg-slate-950/80"></div> */}
    </div>

   <div className="min-h-screen bg-slate-900/40 text-slate-100 font-sans">
  

      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              GafferCard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {wallet && (
              <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl text-emerald-400 font-bold animate-fade-in">
                💰 {wallet.balance} Live USD₮
              </span>
            )}

            <button
              onClick={() => {
  playSound('/sounds/click.mp3');
  setIsModalOpen(true);
}}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ${
                wallet
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950'
              }`}
            >
              {wallet ? `🤖 Wallet Settings` : 'Connect Wallet Dashboard'}
            </button>
          </div>
        </div>
      </header>

      
  <HeroSection />

  <main
    id="dashboard"
    className="max-w-5xl mx-auto px-4 py-12"
  >
        <div className="text-center mb-10">
          <span className="text-xs font-bold font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">
            Tether Dev Cup Entry
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mt-4 mb-2">
            Choose Your Match Day Strategy
          </h2>
          <p className="text-sm text-slate-400">
            Currently targeting: <span className="text-cyan-400 font-semibold font-mono">{activeMatch.homeTeam} vs {activeMatch.awayTeam}</span> ({activeMatch.competition})
          </p>
        </div>

        <LiveMatches onSelectMatch={setActiveMatch} onMatchesLoaded={handleMatchesLoaded} />

        <StrategyDeck walletConnected={!!wallet} onDeploy={handleDeployStrategy} activeMatch={activeMatch} />

        <BetHistory history={betHistory} onClear={handleClearHistory} />
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => { setIsModalOpen(false); setShowSeed(false); }} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">✕</button>

            {wallet ? (
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">Active Wallet Session</h3>
                <p className="text-xs text-slate-400 mb-4">Your non-custodial WDK instance parameter records.</p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 mb-4 space-y-4">
                  <div>
                    <span className="text-emerald-400 block text-[10px] font-bold uppercase mb-1">📋 Public Target Address:</span>
                    <div className="flex gap-2 items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                      <span className="break-all text-slate-200 font-bold select-all flex-1">
                        {shortenAddress(wallet.address)}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.address);
                          alert(`📋 Full Address copied to clipboard:\n\n${wallet.address}`);
                        }}
                        className="px-2.5 py-1 bg-slate-800 text-emerald-400 border border-slate-700 rounded text-[10px] uppercase font-sans font-bold hover:border-emerald-500 transition-all shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3">
                    <span className="text-amber-400 block text-[10px] font-bold uppercase mb-1">🔑 Backup Mnemonic Passphrase:</span>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800 relative flex items-center justify-between gap-2">
                      <p className={`break-words text-slate-300 font-semibold pr-16 select-all ${!showSeed ? 'blur-sm select-none pointer-events-none' : ''}`}>
                        {wallet.mnemonic}
                      </p>
                      <button onClick={() => setShowSeed(!showSeed)} className="text-[10px] absolute right-2 px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 font-sans font-bold">
                        {showSeed ? "Hide" : "Reveal"}
                      </button>
                    </div>
                  </div>

                  <OnChainHistory address={wallet.address} />
                </div>

                <div className="flex gap-2 mb-2">
                  <button onClick={refreshLiveBalance} className="w-1/2 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all">🔄 Refresh Balance</button>
                  <button onClick={() => { localStorage.removeItem('gaffercard_mnemonic'); setWallet(null); setIsModalOpen(false); setShowSeed(false); }} className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl text-xs font-bold transition-all">Log Out</button>
                </div>

                
<a
  href={FAUCET_URL}
  target="_blank"
  rel="noreferrer"
  className="block text-center w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all"
>
  🚰 Get Testnet USDT (Shasta Faucet)
</a>
              </div>
            ) : (
              <div>
                <div className="flex border-b border-slate-800 mb-6 text-sm">
                  <button
                    onClick={() => setModalMode('create')}
                    className={`pb-2 pr-4 font-bold transition-all ${modalMode === 'create' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
                  >
                    Generate Account
                  </button>
                  <button
                    onClick={() => setModalMode('import')}
                    className={`pb-2 px-4 font-bold transition-all ${modalMode === 'import' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}
                  >
                    📥 Import Seed Phrase
                  </button>
                </div>

                {modalMode === 'create' ? (
                  <div>
                    <p className="text-xs text-slate-400 mb-6">Creates a completely fresh cryptographic user credential locally via the open-source Tether standard.</p>
                    <button
                      onClick={handleLaunchTetherWdk}
                      disabled={loading}
                      className="w-full p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900 text-left hover:scale-[1.01] transition-all"
                    >
                      <div className="font-bold text-sm text-emerald-400">{loading ? 'Deriving Architecture...' : '✨ Create Fresh WDK Vault'}</div>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleImportWallet} className="space-y-4">
                    <p className="text-xs text-slate-400">Paste your 12 or 24-word recovery seed phrase below to restore your identity safely on this browser window:</p>
                    <textarea
                      rows={3}
                      value={inputMnemonic}
                      onChange={(e) => setInputMnemonic(e.target.value)}
                      placeholder="e.g. vessel forward match uniform crystal dynamic..."
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-all resize-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
                    >
                      {loading ? 'Reconstructing Keypair...' : '🔒 Recover & Sync Wallet Address'}
                    </button>
                                 </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
<TransactionModal result={txResult} onClose={() => setTxResult(null)} />
    </div>
  </>
  );
}
