import React, { useState, useEffect } from 'react';
import { fetchLiveMatches } from '../services/matchApi';

export default function LiveMatches({ onSelectMatch, onMatchesLoaded }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        setLoading(true);
        setApiError(false);
       const { matches: data, live } = await fetchLiveMatches();

if (data && Array.isArray(data) && data.length > 0) {
  setMatches(data);
  setSelectedId(data[0].id);
  if (onSelectMatch) onSelectMatch(data[0]);
  if (onMatchesLoaded) onMatchesLoaded(data);
}
setApiError(!live);
      } catch (err) {
        console.error("Render boundary caught error:", err);
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };
    loadFixtures();
    // Refresh every 45s so match status (LIVE -> FT, halftime -> final score)
    // updates automatically without needing a manual page reload. 45s is slow
    // enough to avoid hammering the free API tier / triggering the earlier
    // 502 loop issue, while still catching status changes within a reasonable
    // window during a live match.
    const intervalId = setInterval(loadFixtures, 45000);
    return () => clearInterval(intervalId);
  }, []);

  const renderScore = (scoreString, index) => {
    if (!scoreString || typeof scoreString !== 'string' || !scoreString.includes(' - ')) {
      return "0";
    }
    const parts = scoreString.split(' - ');
    return parts[index] !== undefined ? parts[index] : "0";
  };

  return (
    <div className="mb-10 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase font-mono">
            Live Global Fixtures
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
          {apiError ? '⚠️ Proxy Mode' : 'API Status: Connected'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-6 text-slate-500 text-xs font-mono animate-pulse">
          Fetching live pitch matrices...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {matches.map((match) => {
            if (!match) return null;
            const isSelected = selectedId === match.id;
            return (
              <div
                key={match.id}
                onClick={() => {
                  setSelectedId(match.id);
                  if (onSelectMatch) onSelectMatch(match);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-slate-900 to-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                    : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-2 flex justify-between">
                  <span className="truncate max-w-[180px]">{match.competition || "League"}</span>
                  <span className={match.status === 'LIVE' ? 'text-rose-400 font-extrabold animate-pulse' : 'text-slate-400'}>
                    {match.status || "UPCOMING"}
                  </span>
                </div>

                <div className="space-y-2 font-sans">
                  {/* HOME TEAM */}
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {match.homeFlag && typeof match.homeFlag === 'string' && match.homeFlag.startsWith('http') ? (
                        <img src={match.homeFlag} alt="" className="w-5 h-5 object-contain shrink-0 bg-slate-800/40 p-0.5 rounded" />
                      ) : (
                        <span className="text-sm shrink-0">{match.homeFlag || "⚽"}</span>
                      )}
                      <span className="truncate">{match.homeTeam || "Home"}</span>
                    </div>
                    <span className="font-mono text-slate-400 ml-2">
                      {renderScore(match.score, 0)}
                    </span>
                  </div>
                  
                  {/* AWAY TEAM */}
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {match.awayFlag && typeof match.awayFlag === 'string' && match.awayFlag.startsWith('http') ? (
                        <img src={match.awayFlag} alt="" className="w-5 h-5 object-contain shrink-0 bg-slate-800/40 p-0.5 rounded" />
                      ) : (
                        <span className="text-sm shrink-0">{match.awayFlag || "⚽"}</span>
                      )}
                      <span className="truncate">{match.awayTeam || "Away"}</span>
                    </div>
                    <span className="font-mono text-slate-400 ml-2">
                      {renderScore(match.score, 1)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex justify-between items-center">
                  <span className="truncate max-w-[140px]">📍 {match.venue || "Stadium"}</span>
                  {isSelected && (
                    <span className="text-cyan-400 font-bold font-mono text-[9px] uppercase tracking-widest bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-400/20 shrink-0">
                      Targeted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
