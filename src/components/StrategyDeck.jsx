import React from 'react';
import { getDynamicOdds } from '../services/oddsEngine';

const STRATEGIES = [
  {
    id: 'park_the_bus',
    title: 'Park The Bus',
    style: 'border-cyan-500/30 hover:border-cyan-400 text-cyan-400 bg-slate-950/80 shadow-cyan-500/5',
    btnStyle: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400',
    description: 'Bet this match ends low-scoring. You win if the final score has 0 or 1 total goals.',
    stats: { winIf: '0-1 goals', loseIf: '2+ goals' }
  },
  {
    id: 'gegenpressing',
    title: 'Gegenpressing',
    style: 'border-emerald-500/30 hover:border-emerald-400 text-emerald-400 bg-slate-950/80 shadow-emerald-500/5',
    btnStyle: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    description: 'Bet this match ends high-scoring. You win if the final score has 3 or more total goals.',
    stats: { winIf: '3+ goals', loseIf: '0-2 goals' }
  },
  {
    id: 'tiki_taka',
    title: 'Tiki-Taka',
    style: 'border-amber-500/30 hover:border-amber-400 text-amber-400 bg-slate-950/80 shadow-amber-500/5',
    btnStyle: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    description: 'Bet this match ends close and controlled. You win if the final score is exactly 2 total goals, close scoreline.',
    stats: { winIf: 'exactly 2 goals', loseIf: 'other scorelines' }
  }
];

export default function StrategyDeck({ walletConnected, onDeploy, activeMatch }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {STRATEGIES.map((card) => {
        const dynamicMultiplier = getDynamicOdds(card.id, activeMatch);
        return (
          <div 
            key={card.id} 
            className={`border rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 shadow-xl flex flex-col justify-between ${card.style}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold tracking-tight text-slate-100">{card.title}</h3>
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border border-current bg-current/10">
                  {dynamicMultiplier}x
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                {card.description}
              </p>
             <div className="grid grid-cols-2 gap-3 mb-6 border-t border-slate-800 pt-4 text-xs font-mono">
  <div>
    <span className="text-slate-500 block">WIN IF</span>
    <span className="text-emerald-400 font-bold">{card.stats.winIf}</span>
  </div>
  <div>
    <span className="text-slate-500 block">LOSE IF</span>
    <span className="text-rose-400 font-bold">{card.stats.loseIf}</span>
  </div>
</div>
            </div>
            <button
              onClick={() => onDeploy(card.id, dynamicMultiplier)}
              disabled={!walletConnected}
              className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md ${
                walletConnected 
                  ? card.btnStyle
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/80 shadow-none'
              }`}
            >
              {walletConnected ? 'Deploy Strategy (5 USDt)' : 'Connect Wallet First'}
            </button>
          </div>
        );
      })}
    </div>
  );
}