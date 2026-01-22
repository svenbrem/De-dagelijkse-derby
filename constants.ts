
import { Badge, PlayerLevel } from './types';

export const STARTING_ELO = 300; // Updated start value
export const K_FACTOR = 30; // Not used in new logic, but kept for reference

export const getLevelTitle = (rating: number): PlayerLevel => {
  if (rating < 500) return 'Noob';
  if (rating < 800) return 'Beginner';
  if (rating < 1000) return 'Amateur';
  if (rating < 1200) return 'Professional';
  if (rating < 1500) return 'Expert';
  return 'Top Tier';
};

export const getLevelColor = (level: PlayerLevel): string => {
  switch (level) {
    case 'Noob': return 'bg-gray-100 text-gray-600 border border-gray-200';
    case 'Beginner': return 'bg-green-100 text-green-700 border border-green-200';
    case 'Amateur': return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
    case 'Professional': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case 'Expert': return 'bg-purple-100 text-purple-700 border border-purple-200';
    case 'Top Tier': return 'bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm';
  }
};

export const BADGES: Badge[] = [
  {
    id: 'first_win',
    name: 'First Blood',
    description: 'Won your first match',
    icon: '⚔️',
    condition: (p) => p.wins >= 1
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: 'Won 5 games in a row',
    icon: '🔥',
    condition: (p) => p.currentStreak >= 5
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Played over 50 matches',
    icon: '🛡️',
    condition: (p) => (p.wins + p.losses) >= 50
  },
  {
    id: 'crawler',
    name: 'Tunnel Vision',
    description: 'Had to crawl under the table (Lost with 0 goals)',
    icon: '👶',
    condition: (p) => p.crawls > 0
  },
  {
    id: 'legend',
    name: 'Top Tier Titan',
    description: 'Reached "Top Tier" status',
    icon: '👑',
    condition: (p) => p.rating >= 1500
  },
  {
    id: 'champion',
    name: 'Tournament Champion',
    description: 'Won an official tournament',
    icon: '🏆',
    condition: (p) => (p.tournamentWins || 0) > 0
  }
];

// Initial mock data to seed the application
export const MOCK_PLAYERS_SEED = [
  { id: '1', name: 'Dennis', nickname: 'The Menace', avatar: 'https://picsum.photos/150/150?random=1', department: 'Backend', rating: 350, wins: 2, losses: 1, draws: 0, crawls: 0, currentStreak: 1, maxStreak: 1, goalsFor: 25, goalsAgainst: 20, joinedDate: new Date().toISOString(), tournamentWins: 0 },
  { id: '2', name: 'Sarah', nickname: 'Sniper', avatar: 'https://picsum.photos/150/150?random=2', department: 'Design', rating: 520, wins: 5, losses: 2, draws: 0, crawls: 0, currentStreak: 2, maxStreak: 3, goalsFor: 60, goalsAgainst: 40, joinedDate: new Date().toISOString(), tournamentWins: 1 },
  { id: '3', name: 'Mark', nickname: 'Rookie', avatar: 'https://picsum.photos/150/150?random=3', department: 'Sales', rating: 300, wins: 0, losses: 0, draws: 0, crawls: 0, currentStreak: 0, maxStreak: 0, goalsFor: 0, goalsAgainst: 0, joinedDate: new Date().toISOString(), tournamentWins: 0 },
];
