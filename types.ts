
export type PlayerLevel = 'Noob' | 'Beginner' | 'Amateur' | 'Professional' | 'Expert' | 'Top Tier';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  avatar: string;
  department?: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  crawls: number;
  currentStreak: number;
  maxStreak: number;
  goalsFor: number;
  goalsAgainst: number;
  joinedDate: string;
  tournamentWins?: number;
}

export interface Match {
  id: string;
  date: string;
  type: '1v1' | '2v2';
  context: 'daily' | 'tournament';
  tournamentId?: string;
  teamAIds: string[];
  teamBIds: string[];
  scoreA: number;
  scoreB: number;
  ratingDeltaA: number;
  ratingDeltaB: number;
  teamARatingPre?: number;
  teamBRatingPre?: number;
  expectedScoreA?: number;
}

export interface MatchPrefillData {
  type: '1v1' | '2v2';
  teamAIds: string[];
  teamBIds: string[];
}

export interface AppSettings {
  logoUrl?: string;
  organizationName?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (player: Player) => boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

// --- Tournament Specific Types ---

export type TournamentStatus = 'setup' | 'group_stage' | 'knockout_stage' | 'completed';
export type TournamentFormat = 'knockout_only' | 'league' | 'groups_to_knockout';

export interface TournamentTeam {
  id: string;
  name: string;
  playerIds: string[];
  avatar?: string;
  // Stats for group stage
  matchesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
  groupId?: string;
}

export interface TournamentGroup {
    id: string;
    name: string;
    teamIds: string[]; // references to TournamentTeam.id
    matches: TournamentMatchSlot[];
}

export interface TournamentMatchSlot {
  matchId: string;
  roundIndex?: number; // for brackets
  roundName?: string; // e.g., "Group A - Round 1" or "Semi Final"
  teamAId?: string; // undefined if TBD
  teamBId?: string; // undefined if TBD
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  nextMatchId?: string; // Where the winner goes (for bracket)
  status: 'scheduled' | 'active' | 'completed';
  isBye?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: TournamentStatus;
  teams: TournamentTeam[];
  groups: TournamentGroup[]; // Only used if format involves groups
  bracket: TournamentMatchSlot[]; // Used for knockout stage
  winnerTeamId?: string;
  config: {
      teamSize: '1v1' | '2v2';
      format: TournamentFormat;
  }
}
