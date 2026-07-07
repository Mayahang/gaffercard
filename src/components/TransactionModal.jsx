import React from 'react';

export default function TransactionModal({ result, onClose }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">✕</button>

        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4">
          Transaction Broadcast via WDK
        </h3>

        <div className="space-y-3 text-xs font-mono text-slate-300 mb-5">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Target Fixture</span>
            <span className="text-slate-100 font-bold">{result.matchLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Strategy</span>
              <span className="text-slate-100 font-bold">{result.strategyLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Odds</span>
              <span className="text-slate-100 font-bold">{result.multiplier}x</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Tx Hash</span>
            <span className="break-all text-slate-200">{result.txHash}</span>
          </div>
        </div>

        <div className={`rounded-xl p-3 mb-5 text-xs font-semibold border ${
          result.hit === true
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : result.hit === false
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          {result.resultText}
        </div>
<a
        
          href={`https://shasta.tronscan.org/#/transaction/${result.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all"
        >
          View on Tronscan (Shasta)
        </a>
      </div>
    </div>
  );
}