
import React, { useState } from 'react';
import { Player, MatchPrefillData } from '../types';
import { Shuffle, Sparkles, Users, User, ArrowRight, Play } from 'lucide-react';

interface TeamGeneratorProps {
  players: Player[];
  onStartMatch?: (data: MatchPrefillData) => void;
}

interface GeneratedMatch {
    id: number;
    type: '2v2' | '1v1';
    teamA: Player[];
    teamB: Player[];
}

const TeamGenerator: React.FC<TeamGeneratorProps> = ({ players, onStartMatch }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[] | null>(null);
  const [bench, setBench] = useState<Player[]>([]);

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const generateTeams = () => {
    if (selectedIds.length < 2) return;
    
    // 1. Shuffle
    const shuffledIds = [...selectedIds].sort(() => 0.5 - Math.random());
    const pool = shuffledIds.map(id => players.find(p => p.id === id)!);
    
    const matches: GeneratedMatch[] = [];
    const remainingPlayers = [...pool];
    let matchIdCounter = 1;

    // 2. Create as many 2v2 matches as possible
    while (remainingPlayers.length >= 4) {
        matches.push({
            id: matchIdCounter++,
            type: '2v2',
            teamA: [remainingPlayers.shift()!, remainingPlayers.shift()!],
            teamB: [remainingPlayers.shift()!, remainingPlayers.shift()!]
        });
    }

    // 3. Check remainder. If 2 or 3 left, create a 1v1.
    if (remainingPlayers.length >= 2) {
        matches.push({
            id: matchIdCounter++,
            type: '1v1',
            teamA: [remainingPlayers.shift()!],
            teamB: [remainingPlayers.shift()!]
        });
    }

    // 4. Update state (remaining players are bench)
    setGeneratedMatches(matches);
    setBench(remainingPlayers);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-soft p-6 md:p-8 border border-gray-100 mb-24 md:mb-0">
      <h2 className="text-2xl font-bold mb-2 text-gonect-black flex items-center gap-2">
        <Sparkles className="text-gonect-primary" /> Team Generator
      </h2>
      <p className="text-gray-500 mb-8">Selecteer spelers (minimaal 2). De generator maakt automatisch de eerlijkste verdeling (2v2 waar mogelijk).</p>

      {/* Player Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
        {players.map(p => (
          <button
            key={p.id}
            onClick={() => togglePlayer(p.id)}
            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 relative overflow-hidden group ${
              selectedIds.includes(p.id) 
                ? 'bg-green-50 border-green-200 text-gonect-black shadow-md ring-2 ring-gonect-primary ring-opacity-50' 
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <div className={`w-10 h-10 rounded-full p-0.5 ${selectedIds.includes(p.id) ? 'bg-gonect-primary' : 'bg-gray-300'}`}>
               <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full bg-white object-cover border-2 border-white" />
            </div>
            <span className="font-semibold text-xs truncate w-full">{p.name}</span>
            {selectedIds.includes(p.id) && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gonect-primary animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center mb-10 gap-2">
        <button
          onClick={generateTeams}
          disabled={selectedIds.length < 2}
          className="px-8 py-3 bg-gonect-black text-white rounded-full font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
        >
          <Shuffle size={18} /> Genereer Matchups
        </button>
        <span className="text-xs text-gray-400 font-medium">Geselecteerd: {selectedIds.length}</span>
      </div>

      {generatedMatches && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
            
            {/* Matches List */}
            <div className="grid grid-cols-1 gap-6">
                {generatedMatches.map((match) => (
                    <div key={match.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                        
                        {/* Match Info Block */}
                        <div className="flex-1">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Match #{match.id}</span>
                                <span className="bg-gonect-black text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">{match.type}</span>
                            </div>
                            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* Team A */}
                                <div className="flex-1 w-full bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {match.teamA.map(p => (
                                            <img key={p.id} src={p.avatar} className="w-8 h-8 rounded-full border-2 border-white" />
                                        ))}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-blue-700 leading-tight">
                                            {match.teamA.map(p => p.name).join(' & ')}
                                        </span>
                                        <span className="text-[10px] text-blue-400">Team Blauw</span>
                                    </div>
                                </div>

                                <div className="text-gray-300">
                                    <span className="font-black text-xl italic">VS</span>
                                </div>

                                {/* Team B */}
                                <div className="flex-1 w-full bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center gap-3 md:flex-row-reverse md:text-right">
                                    <div className="flex -space-x-2 md:space-x-reverse">
                                        {match.teamB.map(p => (
                                            <img key={p.id} src={p.avatar} className="w-8 h-8 rounded-full border-2 border-white" />
                                        ))}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-orange-700 leading-tight">
                                            {match.teamB.map(p => p.name).join(' & ')}
                                        </span>
                                        <span className="text-[10px] text-orange-400">Team Oranje</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-4 flex items-center justify-center">
                             <button 
                                onClick={() => onStartMatch && onStartMatch({
                                    type: match.type,
                                    teamAIds: match.teamA.map(p => p.id),
                                    teamBIds: match.teamB.map(p => p.id)
                                })}
                                className="w-full md:w-auto px-6 py-3 bg-gonect-primary text-white rounded-xl font-bold shadow-md hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                             >
                                <Play size={18} fill="currentColor" /> Start Wedstrijd
                             </button>
                        </div>

                    </div>
                ))}
            </div>

            {/* Bench / Reserves */}
            {bench.length > 0 && (
                <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 border-dashed">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <User size={14} /> Wisselspelers (Reserve)
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {bench.map(p => (
                            <div key={p.id} className="bg-white px-3 py-2 rounded-lg shadow-sm flex items-center gap-2 border border-gray-200 opacity-75">
                                <img src={p.avatar} className="w-6 h-6 rounded-full" />
                                <span className="text-sm font-medium text-gray-600">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default TeamGenerator;
