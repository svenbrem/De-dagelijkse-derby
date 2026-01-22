
import React, { useState } from 'react';
import { Match, Player } from '../types';
import { Trash2, Calendar, User, Users, Filter, AlertTriangle } from 'lucide-react';
import { deleteMatch } from '../services/eloService';

interface MatchHistoryProps {
  matches: Match[];
  players: Player[];
  onMatchesChanged: () => void;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, players, onMatchesChanged }) => {
  const [filterId, setFilterId] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Onbekend';
  const getPlayerAvatar = (id: string) => players.find(p => p.id === id)?.avatar || '';

  const handleDeleteClick = (matchId: string) => {
    if (deleteConfirmId === matchId) {
        // Second click: perform delete
        deleteMatch(matchId);
        onMatchesChanged();
        setDeleteConfirmId(null);
    } else {
        // First click: show confirmation
        setDeleteConfirmId(matchId);
        // Auto reset after 3 seconds
        setTimeout(() => {
            setDeleteConfirmId(prev => prev === matchId ? null : prev);
        }, 3000);
    }
  };

  // Filter matches based on selection
  const filteredMatches = filterId === 'all' 
    ? matches 
    : matches.filter(m => m.teamAIds.includes(filterId) || m.teamBIds.includes(filterId));

  // Sort players alphabetically for dropdown
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gonect-black flex items-center gap-2">
          <Calendar className="text-gonect-primary" /> Wedstrijd Historie
        </h2>

        {/* Filter Dropdown */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Filter size={16} />
            </div>
            <select
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gonect-primary focus:ring-2 focus:ring-gonect-primary outline-none shadow-sm w-full md:w-64 appearance-none cursor-pointer hover:bg-gray-50"
            >
                <option value="all" className="text-gray-700">Alle Spelers</option>
                <option disabled>──────────</option>
                {sortedPlayers.map(p => (
                    <option key={p.id} value={p.id} className="text-gray-700">{p.name}</option>
                ))}
            </select>
        </div>
      </div>
      
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{matches.length === 0 ? "Nog geen wedstrijden gespeeld." : "Geen wedstrijden gevonden voor deze speler."}</p>
        </div>
      ) : (
        <div className="space-y-4">
            {filteredMatches.map(match => {
                const isTeamAWin = match.scoreA > match.scoreB;
                
                return (
                <div key={match.id} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 relative group hover:shadow-md transition-shadow shadow-soft">
                    
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                            {match.type === '1v1' ? <User size={12}/> : <Users size={12}/>}
                            {new Date(match.date).toLocaleString()}
                        </div>
                        
                        {deleteConfirmId === match.id ? (
                            <button 
                                onClick={() => handleDeleteClick(match.id)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold shadow-md animate-pulse hover:bg-red-600 transition-colors flex items-center gap-1 -mr-2 -mt-2 z-10 relative"
                                title="Klik nogmaals om definitief te verwijderen"
                            >
                                <AlertTriangle size={12} /> Wis?
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleDeleteClick(match.id)}
                                className="text-gray-300 hover:text-red-500 p-2 -mr-2 -mt-2 transition-colors relative z-10"
                                title="Verwijder Wedstrijd"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Team A */}
                        <div className={`flex-1 flex flex-col items-center ${isTeamAWin ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                            <div className="flex -space-x-3 mb-2">
                                {match.teamAIds.map(id => (
                                    <img key={id} src={getPlayerAvatar(id)} className="w-10 h-10 rounded-full border-2 border-white" title={getPlayerName(id)} />
                                ))}
                            </div>
                            <div className="text-sm font-bold text-blue-600 text-center">
                                {match.teamAIds.map(id => getPlayerName(id)).join(' & ')}
                            </div>
                            <div className={`text-xs mt-1 ${match.ratingDeltaA >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {match.ratingDeltaA > 0 ? '+' : ''}{match.ratingDeltaA} elo
                            </div>
                        </div>

                        {/* Score */}
                        <div className="px-4 flex flex-col items-center">
                            <div className="text-3xl font-black text-gonect-black tracking-wider">
                                {match.scoreA} - {match.scoreB}
                            </div>
                            {match.scoreA === 0 || match.scoreB === 0 ? (
                                <div className="text-[10px] text-pink-600 uppercase font-bold mt-1 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                                    Kruipen!
                                </div>
                            ) : null}
                        </div>

                        {/* Team B */}
                        <div className={`flex-1 flex flex-col items-center ${!isTeamAWin ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                            <div className="flex -space-x-3 mb-2">
                                {match.teamBIds.map(id => (
                                    <img key={id} src={getPlayerAvatar(id)} className="w-10 h-10 rounded-full border-2 border-white" title={getPlayerName(id)} />
                                ))}
                            </div>
                            <div className="text-sm font-bold text-orange-600 text-center">
                                {match.teamBIds.map(id => getPlayerName(id)).join(' & ')}
                            </div>
                            <div className={`text-xs mt-1 ${match.ratingDeltaB >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {match.ratingDeltaB > 0 ? '+' : ''}{match.ratingDeltaB} elo
                            </div>
                        </div>
                    </div>

                </div>
                )
            })}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
