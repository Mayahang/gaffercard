import React from 'react';

function buildShareText(bet) {
  const outcomeText = bet.hit === true ? 'HIT ✅' : bet.hit === false ? 'MISSED ❌' : 'PENDING ⏳';
  return (
    `I bet ${bet.strategyLabel} on ${bet.matchLabel} in #GafferCard for the @Tether Dev Cup.\n\n` +
    `Result: ${outcomeText}\n\n` +
    `Real on-chain WDK transaction, verify it yourself:\n` +
    `https://shasta.tronscan.org/#/transaction/${bet.txHash}`
  );
}

function shareOnX(bet) {
  const text = buildShareText(bet);
  const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function BetHistory({ history, onClear }) {
  if (!history || history.length === 0) {
    return null;
  }

  const wins = history.filter(function (b) { return b.hit === true; }).length;
  const losses = history.filter(function (b) { return b.hit === false; }).length;
  const pending = history.filter(function (b) { return b.hit === null; }).length;

  const reversed = history.slice().reverse();

  return (
    <div className="mt-10 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Bet History</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">{wins}W</span>
            {' / '}
            <span className="text-rose-400 font-bold">{losses}L</span>
            {pending > 0 ? (
              <span className="text-amber-400 font-bold">{' / ' + pending + ' pending'}</span>
            ) : null}
          </span>
          <button onClick={onClear} className="text-xs uppercase font-bold text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 px-2 py-1 rounded transition-all">
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {reversed.map(function (bet) {
          const statusColor = bet.hit === true ? 'text-emerald-400' : bet.hit === false ? 'text-rose-400' : 'text-amber-400';
          const borderColor = bet.hit === true ? 'border-emerald-500/20 bg-emerald-500/5' : bet.hit === false ? 'border-rose-500/20 bg-rose-500/5' : 'border-amber-500/20 bg-amber-500/5';
          const statusLabel = bet.hit === true ? 'Hit' : bet.hit === false ? 'Miss' : 'Pending';
          const txUrl = 'https://shasta.tronscan.org/#/transaction/' + bet.txHash;
          const payoutUrl = bet.payoutHash ? 'https://shasta.tronscan.org/#/transaction/' + bet.payoutHash : null;

          return (
            <div key={bet.id} className={'flex items-center justify-between p-3 rounded-xl border text-xs ' + borderColor}>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono font-bold text-slate-200">{bet.matchLabel}</span>
                <span className="text-slate-500">{bet.strategyLabel} - 5 USDT</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <span className={'font-bold uppercase ' + statusColor}>{statusLabel}</span>
                  <a href={txUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-cyan-400 underline underline-offset-2">
                    view bet tx
                  </a>
                  {payoutUrl ? (
                    <a href={payoutUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
                      view payout tx
                    </a>
                  ) : null}
                </div>
                <button
                  onClick={function () { shareOnX(bet); }}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 px-2 py-1.5 rounded transition-all"
                >
                  Share
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
