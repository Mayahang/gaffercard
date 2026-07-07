import React, { useEffect, useState } from 'react';
import { fetchOnChainHistory } from '../services/tronExplorer';

const shortenAddr = (addr) => {
  if (!addr) return '';
  return addr.slice(0, 8) + '...' + addr.slice(-6);
};

export default function OnChainHistory({ address }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    setLoading(true);
    fetchOnChainHistory(address).then((result) => {
      if (!cancelled) {
        setTxs(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [address]);

  return (
    <div className="border-t border-slate-800/80 pt-3 mt-4">
      <span className="text-cyan-400 block text-[10px] font-bold uppercase mb-2">On-Chain Transaction History</span>

      {loading ? (
        <p className="text-xs text-slate-500">Loading from Tron Shasta...</p>
      ) : txs.length === 0 ? (
        <p className="text-xs text-slate-500">No on-chain USDT transactions found yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {txs.map((tx) => (
            <a
              key={tx.id}
              href={'https://shasta.tronscan.org/#/transaction/' + tx.id}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-xs bg-slate-900/60 border border-slate-800 rounded px-2 py-1.5 hover:border-cyan-500/40 transition-all"
            >
              <span className={tx.direction === 'in' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {tx.direction === 'in' ? '↓ Received' : '↑ Sent'}
              </span>
              <span className="text-slate-300">{tx.amount} {tx.symbol}</span>
              <span className="text-slate-500">{shortenAddr(tx.counterparty)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}