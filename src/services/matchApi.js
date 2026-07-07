// src/services/matchApi.js
const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/123'; // shared free key
const WORLD_CUP_LEAGUE_ID = '4429'; // FIFA World Cup
const WORLD_CUP_SEASON = '2026';

const mapEvent = (event) => {
  const isPlayed = event.intHomeScore !== null && event.intHomeScore !== undefined;
  return {
    id: event.idEvent,
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    homeFlag: '⚽',
    awayFlag: '⚽',
    status: isPlayed ? 'FT' : (event.strTime ? `Kickoff ${event.strTime.slice(0, 5)}` : 'UPCOMING'),
    score: isPlayed ? `${event.intHomeScore} - ${event.intAwayScore}` : '0 - 0',
    competition: event.strLeague || 'FIFA World Cup',
    venue: event.strVenue || 'Stadium',
    date: event.dateEvent,
  };
};

const toDateString = (date) => date.toISOString().slice(0, 10);

export const fetchLiveMatches = async () => {
  try {
    const seasonRes = await fetch(`${SPORTSDB_BASE}/eventsseason.php?id=${WORLD_CUP_LEAGUE_ID}&s=${WORLD_CUP_SEASON}`);
    if (!seasonRes.ok) throw new Error('TheSportsDB season request failed');
    const seasonData = await seasonRes.json();
    const recent = (seasonData.events || []).map(mapEvent).slice(-3);

    const today = new Date();
    const dayOffsets = [0, 1, 2];
    const dayResponses = await Promise.all(
      dayOffsets.map((offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        const dateStr = toDateString(d);
        return fetch(`${SPORTSDB_BASE}/eventsday.php?d=${dateStr}&l=${WORLD_CUP_LEAGUE_ID}`);
      })
    );

    const dayJson = await Promise.all(dayResponses.map((r) => (r.ok ? r.json() : { events: [] })));
    const upcomingRaw = dayJson.flatMap((d) => d.events || []);
    const upcoming = upcomingRaw
      .map(mapEvent)
      .filter((m) => m.status !== 'FT')
      .slice(0, 5);

    const combined = [...recent, ...upcoming];

    if (combined.length === 0) throw new Error('No fixtures returned');

    return { matches: combined, live: true };
  } catch (error) {
    console.warn('Live fixture fetch failed, falling back to demo fixtures:', error);
    return { matches: getBackupLiveMatrix(), live: false };
  }
};

export const fetchEventById = async (eventId) => {
  try {
    const res = await fetch(`${SPORTSDB_BASE}/lookupevent.php?id=${eventId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const event = (data.events || [])[0];
    if (!event) return null;
    return mapEvent(event);
  } catch (err) {
    console.warn('Event lookup failed:', err);
    return null;
  }
};

function getBackupLiveMatrix() {
  return [
    { id: 3001, homeTeam: 'Manchester United', awayTeam: 'Liverpool FC', homeFlag: '⚽', awayFlag: '⚽', status: 'UPCOMING', score: '0 - 0', competition: 'English Premier League', venue: 'Old Trafford' },
    { id: 3002, homeTeam: 'Chelsea FC', awayTeam: 'Manchester City', homeFlag: '⚽', awayFlag: '⚽', status: 'UPCOMING', score: '0 - 0', competition: 'English Premier League', venue: 'Stamford Bridge' },
    { id: 3003, homeTeam: 'Tottenham Hotspur', awayTeam: 'Arsenal FC', homeFlag: '⚽', awayFlag: '⚽', status: 'UPCOMING', score: '0 - 0', competition: 'English Premier League', venue: 'Tottenham Stadium' },
  ];
}
