
import { Player, Match, Tournament, TournamentTeam, TournamentMatchSlot, TournamentGroup, TournamentStatus } from '../types';
import { STARTING_ELO, MOCK_PLAYERS_SEED } from '../constants';

const PLAYERS_KEY = 'gonect_foosball_players';
const MATCHES_KEY = 'gonect_foosball_matches';
const TOURNAMENTS_KEY = 'gonect_foosball_tournaments';

// --- Data Persistence ---

export const getPlayers = (): Player[] => {
  const stored = localStorage.getItem(PLAYERS_KEY);
  if (!stored) {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(MOCK_PLAYERS_SEED));
    return MOCK_PLAYERS_SEED as Player[];
  }
  return JSON.parse(stored);
};

export const savePlayers = (players: Player[]) => {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
};

export const updatePlayerProfile = (id: string, updates: Partial<Player>) => {
  const players = getPlayers();
  const index = players.findIndex(p => p.id === id);
  if (index !== -1) {
    players[index] = { ...players[index], ...updates };
    savePlayers(players);
    return players[index];
  }
  return null;
};

export const deletePlayer = (playerId: string) => {
  const players = getPlayers();
  const updatedPlayers = players.filter(p => p.id !== playerId);
  savePlayers(updatedPlayers);
  return updatedPlayers;
};

export const getMatches = (): Match[] => {
  const stored = localStorage.getItem(MATCHES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveMatch = (match: Match) => {
  const matches = getMatches();
  matches.unshift(match);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
};

export const deleteMatch = (matchId: string) => {
  const matches = getMatches().filter(m => m.id !== matchId);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  recalculateAllStats(matches);
};

// --- Tournament Persistence ---

export const getTournaments = (): Tournament[] => {
  const stored = localStorage.getItem(TOURNAMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveTournament = (tournament: Tournament) => {
  const tournaments = getTournaments();
  const index = tournaments.findIndex(t => t.id === tournament.id);
  if (index !== -1) {
    tournaments[index] = tournament;
  } else {
    tournaments.unshift(tournament);
  }
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
};

export const deleteTournament = (id: string) => {
    const tournaments = getTournaments().filter(t => t.id !== id);
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
};

// --- Tournament Logic Helpers ---

const getNextPowerOf2 = (n: number) => {
    let count = 1;
    while (count < n) count *= 2;
    return count;
};

const getRoundName = (totalMatchesInRound: number, roundIdx: number, totalRounds: number): string => {
    const roundsLeft = totalRounds - roundIdx;
    if (roundsLeft === 1) return 'Finale';
    if (roundsLeft === 2) return 'Halve Finale';
    if (roundsLeft === 3) return 'Kwartfinale';
    return `Ronde ${roundIdx + 1}`;
};

// Generate a Bracket (Knockout) for a list of team IDs
// seedingOrder: Assumes teams are sorted by seed (1st is best).
export const generateKnockoutBracket = (teams: TournamentTeam[], seedingOrder: string[]): TournamentMatchSlot[] => {
    const n = seedingOrder.length;
    const bracketSize = getNextPowerOf2(n);
    const byes = bracketSize - n;
    
    const seededTeams = [...seedingOrder];
    // Add nulls for byes
    for(let i=0; i<byes; i++) {
        seededTeams.push('BYE');
    }
    
    // Pair top vs bottom to distribute Byes fairly (Top seeds get Byes first)
    const pairings = [];
    let l = 0; 
    let r = seededTeams.length - 1;
    while(l < r) {
        pairings.push({ high: seededTeams[l], low: seededTeams[r] });
        l++;
        r--;
    }
    
    const matches: TournamentMatchSlot[] = [];
    const roundCount = Math.log2(bracketSize);
    
    // Create Round 1 Matches
    let matchCounter = 0;
    const round1: TournamentMatchSlot[] = [];
    
    pairings.forEach((pair, idx) => {
        const isBye = pair.low === 'BYE';
        const teamAId = pair.high !== 'BYE' ? pair.high : undefined;
        const teamBId = pair.low !== 'BYE' ? pair.low : undefined;
        
        round1.push({
            matchId: `ko_r0_m${idx}`,
            roundIndex: 0,
            roundName: getRoundName(pairings.length, 0, roundCount),
            teamAId: teamAId,
            teamBId: teamBId,
            status: isBye ? 'completed' : 'scheduled',
            isBye: isBye,
            winnerId: isBye ? teamAId : undefined,
            scoreA: isBye ? 1 : undefined,
            scoreB: isBye ? 0 : undefined,
        });
        matchCounter++;
    });
    
    matches.push(...round1);
    
    // Subsequent Rounds
    let currentRound = round1;
    let rIdx = 1;
    while(currentRound.length > 1) {
        const nextRound = [];
        for(let i=0; i<currentRound.length; i+=2) {
            const m1 = currentRound[i];
            const m2 = currentRound[i+1];
            const nextMatchId = `ko_r${rIdx}_m${nextRound.length}`;
            
            m1.nextMatchId = nextMatchId;
            if(m2) m2.nextMatchId = nextMatchId;
            
            nextRound.push({
                matchId: nextMatchId,
                roundIndex: rIdx,
                roundName: getRoundName(pairings.length, rIdx, roundCount),
                status: 'scheduled',
                teamAId: m1.winnerId, // might be undefined
                teamBId: m2?.winnerId
            });
        }
        matches.push(...nextRound);
        currentRound = nextRound;
        rIdx++;
    }
    
    return matches;
}

export const createTournament = (name: string, teamType: '1v1' | '2v2', teams: TournamentTeam[]): Tournament => {
    // ALWAYS Force Knockout Only
    const format = 'knockout_only';
    const status = 'knockout_stage';
    
    // Shuffle teams for random seeding initially
    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const bracket = generateKnockoutBracket(teams, shuffled.map(t => t.id));

    // Initial stats for teams (kept for consistency, though less used in pure knockout)
    teams.forEach(t => {
        t.matchesPlayed = 0;
        t.wins = 0;
        t.losses = 0;
        t.draws = 0;
        t.goalsFor = 0;
        t.goalsAgainst = 0;
        t.points = 0;
    });

    const tournament: Tournament = {
        id: Date.now().toString(),
        name,
        date: new Date().toISOString(),
        status,
        teams,
        groups: [], // No groups
        bracket,
        config: { teamSize: teamType, format }
    };

    saveTournament(tournament);
    return tournament;
}

export const updateTournamentMatch = (tournamentId: string, matchId: string, scoreA: number, scoreB: number): Tournament | null => {
    const tournaments = getTournaments();
    const tIndex = tournaments.findIndex(t => t.id === tournamentId);
    if (tIndex === -1) return null;
    const tournament = tournaments[tIndex];
    
    // Only check Bracket
    const mIdx = tournament.bracket.findIndex(m => m.matchId === matchId);
    if (mIdx !== -1) {
        const match = tournament.bracket[mIdx];
        
        // Track previous completion state to avoid double-counting stats
        const wasAlreadyCompleted = match.status === 'completed';

        match.scoreA = scoreA;
        match.scoreB = scoreB;
        match.status = 'completed';
        match.winnerId = scoreA > scoreB ? match.teamAId : match.teamBId; // No draws in knockout
        
        // --- HANDLE STATS (Crawls & Wins) ---
        // Only apply stats if this match wasn't already completed (prevents abuse/bugs on edit)
        if (!wasAlreadyCompleted) {
            const allPlayers = getPlayers();
            let playersUpdated = false;

            // 1. Check for Crawls (0 score)
            if (scoreA === 0 && match.teamAId) {
                const teamA = tournament.teams.find(t => t.id === match.teamAId);
                teamA?.playerIds.forEach(pid => {
                     const p = allPlayers.find(pl => pl.id === pid);
                     if(p) { p.crawls = (p.crawls || 0) + 1; playersUpdated = true; }
                });
            }
            if (scoreB === 0 && match.teamBId) {
                const teamB = tournament.teams.find(t => t.id === match.teamBId);
                teamB?.playerIds.forEach(pid => {
                     const p = allPlayers.find(pl => pl.id === pid);
                     if(p) { p.crawls = (p.crawls || 0) + 1; playersUpdated = true; }
                });
            }
            
            if (playersUpdated) savePlayers(allPlayers);
        }

        // Propagate to next match
        if (match.nextMatchId && match.winnerId) {
            const nextMatch = tournament.bracket.find(nm => nm.matchId === match.nextMatchId);
            if (nextMatch) {
                // Determine slot based on match ID logic or simple availability
                const matchIndexInRound = parseInt(match.matchId.split('_m')[1]);
                if (matchIndexInRound % 2 === 0) {
                    nextMatch.teamAId = match.winnerId;
                } else {
                    nextMatch.teamBId = match.winnerId;
                }
            }
        } else if (!match.nextMatchId) {
            // Final Match!
            const wasTournamentCompleted = tournament.status === 'completed';
            
            tournament.winnerTeamId = match.winnerId;
            tournament.status = 'completed';

            // AWARD CHAMPION REWARDS
            // Check tournament completion state specifically for the rewards
            if (!wasTournamentCompleted && match.winnerId) {
                const winningTeam = tournament.teams.find(t => t.id === match.winnerId);
                if (winningTeam) {
                    // Re-fetch players to ensure we have latest crawl updates
                    const allPlayers = getPlayers();
                    let playersUpdated = false;
                    
                    winningTeam.playerIds.forEach(pid => {
                        const pIdx = allPlayers.findIndex(p => p.id === pid);
                        if (pIdx !== -1) {
                            allPlayers[pIdx].rating += 100; // Reward +100 ELO
                            allPlayers[pIdx].tournamentWins = (allPlayers[pIdx].tournamentWins || 0) + 1; // Reward Win Count
                            playersUpdated = true;
                        }
                    });

                    if (playersUpdated) {
                        savePlayers(allPlayers);
                    }
                }
            }
        }
    }
    
    saveTournament(tournament);
    return tournament;
}

export const finishGroupStage = (tournamentId: string): Tournament | null => {
   // Deprecated for this version
   return null;
}

// --- Core Logic ---

const resetPlayerStats = (player: Player): Player => ({
  ...player,
  rating: STARTING_ELO,
  wins: 0,
  losses: 0,
  draws: 0,
  crawls: 0,
  currentStreak: 0,
  maxStreak: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  tournamentWins: 0,
});

const applyMatchToPlayers = (match: Match, playerMap: Map<string, Player>) => {
  const { teamAIds, teamBIds, scoreA, scoreB, ratingDeltaA, ratingDeltaB } = match;
  const allIds = [...teamAIds, ...teamBIds];

  const deltaPerPlayerA = ratingDeltaA / teamAIds.length;
  const deltaPerPlayerB = ratingDeltaB / teamBIds.length;

  allIds.forEach(id => {
    const p = playerMap.get(id);
    if (!p) return;

    const isTeamA = teamAIds.includes(id);
    const myScore = isTeamA ? scoreA : scoreB;
    const oppScore = isTeamA ? scoreB : scoreA;
    
    const myDelta = isTeamA ? deltaPerPlayerA : deltaPerPlayerB;
    p.rating = Math.round(Math.max(0, p.rating + myDelta));

    p.goalsFor += myScore;
    p.goalsAgainst += oppScore;

    if (myScore === 0 && oppScore > 0) {
      p.crawls = (p.crawls || 0) + 1;
    }

    if (myScore > oppScore) {
      p.wins += 1;
      p.currentStreak += 1;
      if (p.currentStreak > p.maxStreak) p.maxStreak = p.currentStreak;
    } else if (myScore < oppScore) {
      p.losses += 1;
      p.currentStreak = 0;
    } else {
      p.draws += 1;
    }
  });
};

const recalculateAllStats = (matches: Match[]) => {
  let players = getPlayers().map(resetPlayerStats);
  const playerMap = new Map(players.map(p => [p.id, p]));
  const chronologicalMatches = [...matches].reverse();

  chronologicalMatches.forEach(match => {
     applyMatchToPlayers(match, playerMap);
  });
  
  // Note: Recalculating does NOT currently reconstruct tournament wins from tournament history 
  // because tournaments are stored separately from matches in this simple architecture.
  // In a robust system, we would re-process tournaments here too. 
  // For now, we assume tournaments wins are persistent unless manually wiped.

  savePlayers(Array.from(playerMap.values()));
};

export const createPlayer = (name: string, department: string): Player => {
  const players = getPlayers();
  const newPlayer: Player = {
    id: Date.now().toString(),
    name,
    nickname: '',
    department,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    rating: STARTING_ELO,
    wins: 0,
    losses: 0,
    draws: 0,
    crawls: 0,
    currentStreak: 0,
    maxStreak: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    joinedDate: new Date().toISOString(),
    tournamentWins: 0,
  };
  players.push(newPlayer);
  savePlayers(players);
  return newPlayer;
};

interface EloCalculationResult {
  deltaA: number;
  deltaB: number;
  teamRatingA: number;
  teamRatingB: number;
  expectedA: number;
}

export const calculateEloMatch = (
  teamAPlayers: Player[],
  teamBPlayers: Player[],
  scoreA: number,
  scoreB: number
): EloCalculationResult => {
  
  const K = 32; 
  
  const ratingSumA = teamAPlayers.reduce((sum, p) => sum + p.rating, 0);
  const ratingSumB = teamBPlayers.reduce((sum, p) => sum + p.rating, 0);
  
  const teamRatingA = ratingSumA / teamAPlayers.length;
  const teamRatingB = ratingSumB / teamBPlayers.length;

  const D = teamRatingB - teamRatingA;
  
  const expectedA = 1 / (1 + Math.pow(10, D / 400));
  const expectedB = 1 - expectedA;

  let S_A = 0.5;
  if (scoreA > scoreB) S_A = 1;
  else if (scoreB > scoreA) S_A = 0;
  
  const S_B = 1 - S_A;

  const rawDeltaA = K * (S_A - expectedA);
  const rawDeltaB = K * (S_B - expectedB);

  const adjustedDeltaA = rawDeltaA > 0 ? rawDeltaA * 2 : rawDeltaA;
  const adjustedDeltaB = rawDeltaB > 0 ? rawDeltaB * 2 : rawDeltaB;

  const finalDeltaPerPlayerA = Math.round(adjustedDeltaA);
  const finalDeltaPerPlayerB = Math.round(adjustedDeltaB);

  return {
    deltaA: finalDeltaPerPlayerA * teamAPlayers.length,
    deltaB: finalDeltaPerPlayerB * teamBPlayers.length,
    teamRatingA,
    teamRatingB,
    expectedA
  };
};

export const recordMatch = (
  teamAIds: string[],
  teamBIds: string[],
  scoreA: number,
  scoreB: number,
  type: '1v1' | '2v2',
  context: 'daily' | 'tournament' = 'daily',
  tournamentId?: string
): { match: Match, updatedPlayers: Player[] } => {
  const players = getPlayers();
  const playerMap = new Map(players.map(p => [p.id, p]));
  
  const teamAPlayers = teamAIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];
  const teamBPlayers = teamBIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];

  const { deltaA, deltaB, teamRatingA, teamRatingB, expectedA } = calculateEloMatch(teamAPlayers, teamBPlayers, scoreA, scoreB);

  const newMatch: Match = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    type,
    context,
    tournamentId,
    teamAIds,
    teamBIds,
    scoreA,
    scoreB,
    ratingDeltaA: deltaA,
    ratingDeltaB: deltaB,
    teamARatingPre: teamRatingA,
    teamBRatingPre: teamRatingB,
    expectedScoreA: expectedA
  };

  applyMatchToPlayers(newMatch, playerMap);

  const updatedPlayers = Array.from(playerMap.values());
  savePlayers(updatedPlayers);
  saveMatch(newMatch);

  return { match: newMatch, updatedPlayers };
};
