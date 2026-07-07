// src/services/strategyEngine.js
export function evaluateStrategy(strategyId, match) {
  if (!match || match.status !== 'FT') {
    return { settled: false };
  }

  const [homeScore, awayScore] = match.score.split(' - ').map(Number);
  const totalGoals = homeScore + awayScore;
  const goalDiff = Math.abs(homeScore - awayScore);

  let hit = false;
  let reason = '';

  switch (strategyId) {
    case 'park_the_bus':
      hit = totalGoals <= 1;
      reason = hit
        ? `Low-scoring result (${homeScore}-${awayScore}) rewards a defensive strategy.`
        : `Match had ${totalGoals} goals, too open for a defensive strategy.`;
      break;
    case 'gegenpressing':
      hit = totalGoals >= 3;
      reason = hit
        ? `High-scoring match (${homeScore}-${awayScore}) rewards an aggressive pressing strategy.`
        : `Only ${totalGoals} goals, not chaotic enough for pressing to pay off.`;
      break;
    case 'tiki_taka':
      hit = totalGoals === 2 && goalDiff <= 1;
      reason = hit
        ? `Controlled scoreline (${homeScore}-${awayScore}) matches a possession-based approach.`
        : `Scoreline (${homeScore}-${awayScore}) doesn't match a controlled possession game.`;
      break;
    default:
      reason = 'Unknown strategy.';
  }

  return { settled: true, hit, reason, homeScore, awayScore };
}