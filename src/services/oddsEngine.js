// src/services/oddsEngine.js
// Deterministic "dynamic" odds derived from the real selected fixture,
// so the multiplier changes match-to-match instead of being fixed.
// Simplified model: our free-tier data source only gives team names/venue,
// not true bookmaker odds or team rankings, so this uses the fixture itself
// as a seed to keep odds varied but consistent per match.

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

const BASE_MULTIPLIERS = {
  park_the_bus: 2.5,
  gegenpressing: 1.8,
  tiki_taka: 2.0,
};

export function getDynamicOdds(strategyId, match) {
  const base = BASE_MULTIPLIERS[strategyId] || 2.0;
  if (!match) return base.toFixed(1);

  const seed = hashString(`${match.homeTeam}-${match.awayTeam}-${strategyId}`);
  const variance = (seed % 60) / 100; // 0.00 to 0.59
  const multiplier = base - 0.3 + variance;

  return Math.max(1.2, multiplier).toFixed(1);
}