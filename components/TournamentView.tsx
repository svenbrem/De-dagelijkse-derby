
import React, { useState, useEffect } from 'react';
import { Player, Tournament, TournamentTeam, TournamentMatchSlot } from '../types';
import { getTournaments, saveTournament, createTournament, updateTournamentMatch, deleteTournament } from '../services/eloService';
import { Trophy, Plus, Play, Crown, Trash2, ChevronRight, GitBranch, AlertTriangle, Star, Sparkles, Zap, Users, User } from 'lucide-react';

interface TournamentViewProps {
  players: Player[];
  onUpdate?: () => void;
}

const TournamentView: React.FC<TournamentViewProps> = ({ players, onUpdate }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Creation State
  const [newName, setNewName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamType, setTeamType] = useState<'1v1' | '2v2'>('1v1');

  // Match Scoring State
  const [scoringMatchId, setScoringMatchId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Celebration State
  const [showCelebration, setShowCelebration] = useState<TournamentTeam | null>(null);

  useEffect(() => {
    setTournaments(getTournaments());
  }, []);

  const handleCreate = () => {
    if (!newName || selectedPlayerIds.length < 2) return;

    // Generate Teams
    const shuffled = [...selectedPlayerIds].sort(() => 0.5 - Math.random());
    const teams: TournamentTeam[] = [];
    
    if (teamType === '1v1') {
        shuffled.forEach((pid, idx) => {
             const p = players.find(pl => pl.id === pid);
             teams.push({ id: `t_${idx}`, name: p?.name || '?', playerIds: [pid], avatar: p?.avatar });
        });
    } else {
        // 2v2
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                const p1 = players.find(p => p.id === shuffled[i]);
                const p2 = players.find(p => p.id === shuffled[i+1]);
                teams.push({ 
                    id: `t_${i}`, 
                    name: `${p1?.name} & ${p2?.name}`, 
                    playerIds: [shuffled[i], shuffled[i+1]],
                    avatar: p1?.avatar 
                });
            }
        }
    }

    const newTournament = createTournament(newName, teamType, teams);

    setTournaments([newTournament, ...tournaments]);
    setActiveTournament(newTournament);
    
    setIsCreating(false);
    setNewName('');
    setSelectedPlayerIds([]);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (deleteConfirmId === id) {
          deleteTournament(id);
          setTournaments(tournaments.filter(t => t.id !== id));
          if(activeTournament?.id === id) setActiveTournament(null);
          setDeleteConfirmId(null);
      } else {
          setDeleteConfirmId(id);
          setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
      }
  }

  const handleScoreSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeTournament || !scoringMatchId) return;
      
      const sA = parseInt(scoreA);
      const sB = parseInt(scoreB);
      if(isNaN(sA) || isNaN(sB)) return;

      const updated = updateTournamentMatch(activeTournament.id, scoringMatchId, sA, sB);
      
      if(updated) {
          const tIndex = tournaments.findIndex(t => t.id === updated.id);
          const newTournaments = [...tournaments];
          newTournaments[tIndex] = updated;
          setTournaments(newTournaments);
          setActiveTournament(updated);
          
          if (onUpdate) onUpdate();

          // Check if this was the finale and we have a winner
          const match = updated.bracket.find(m => m.matchId === scoringMatchId);
          if (match && !match.nextMatchId && match.winnerId && match.status === 'completed') {
             const winner = updated.teams.find(t => t.id === match.winnerId);
             if (winner) {
                 setShowCelebration(winner);
             }
          }
      }
      
      setScoringMatchId(null);
      setScoreA('');
      setScoreB('');
  }

  const togglePlayer = (id: string) => {
      if(selectedPlayerIds.includes(id)) setSelectedPlayerIds(selectedPlayerIds.filter(pid => pid !== id));
      else setSelectedPlayerIds([...selectedPlayerIds, id]);
  }

  // --- Render Helpers ---

  const renderBracket = (tournament: Tournament) => {
      if (tournament.bracket.length === 0) {
           return (
               <div className="text-center py-10 text-gray-400">
                   <GitBranch size={48} className="mx-auto mb-2 opacity-20" />
                   <p>Nog geen bracket beschikbaar.</p>
               </div>
           );
      }

      const rounds: {[key: number]: TournamentMatchSlot[]} = {};
      tournament.bracket.forEach(m => {
          if(m.roundIndex === undefined) return;
          if(!rounds[m.roundIndex]) rounds[m.roundIndex] = [];
          rounds[m.roundIndex].push(m);
      });

      const roundIndices = Object.keys(rounds).map(Number).sort((a,b) => a-b);

      return (
          // Adjusted padding and scrolling for mobile
          <div className="flex gap-6 md:gap-12 overflow-x-auto pb-12 pt-8 px-4 -mx-6 md:-mx-0 md:px-4 items-center snap-x snap-mandatory">
              {roundIndices.map(rIdx => {
                  const isFinaleRound = rounds[rIdx].some(m => !m.nextMatchId);
                  
                  return (
                    <div key={rIdx} className={`flex flex-col justify-around gap-8 md:gap-12 min-w-[240px] md:min-w-[260px] snap-center ${isFinaleRound ? 'min-w-[280px] md:min-w-[320px] mx-4' : ''}`}>
                        <div className="sticky top-0 z-10">
                            {isFinaleRound ? (
                                <div className="text-center animate-pulse">
                                    <h3 className="inline-block px-4 py-1 rounded-full bg-yellow-400 text-yellow-900 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-lg mb-2">
                                        Kampioenschap
                                    </h3>
                                    <div className="text-[9px] md:text-[10px] font-bold text-yellow-600 flex items-center justify-center gap-1">
                                        <Zap size={10} fill="currentColor"/>
                                        <span>INZET: +100 ELO</span>
                                        <Zap size={10} fill="currentColor"/>
                                    </div>
                                </div>
                            ) : (
                                <h3 className="text-center font-bold text-gray-400 uppercase text-xs tracking-wider mb-2 bg-gray-50/90 py-1 rounded">
                                    {rounds[rIdx][0].roundName}
                                </h3>
                            )}
                        </div>

                        {rounds[rIdx].map(match => {
                            const teamA = tournament.teams.find(t => t.id === match.teamAId);
                            const teamB = tournament.teams.find(t => t.id === match.teamBId);
                            const isDecided = match.status === 'completed';
                            const isFinale = !match.nextMatchId;
                            
                            return (
                                <div key={match.matchId} className="relative group">
                                    {/* Connector Line (Hidden on mobile if it gets too messy? No, let's keep it simple) */}
                                    {match.nextMatchId && (
                                        <div className="hidden md:block absolute top-1/2 -right-12 w-12 h-0.5 bg-gray-300 z-0"></div>
                                    )}

                                    <div 
                                        className={`
                                            relative flex flex-col gap-2 md:gap-3 transition-all duration-300
                                            ${isFinale 
                                                ? 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50 border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.4)] scale-105 md:scale-110 p-4 md:p-5 rounded-2xl' 
                                                : `bg-white border rounded-xl shadow-sm p-3 md:p-4 ${match.status === 'completed' ? 'border-gray-200' : 'border-blue-200 shadow-md cursor-pointer hover:scale-[1.02] hover:shadow-lg'}`
                                            }
                                        `}
                                        onClick={() => {
                                            if (match.status !== 'completed' && teamA && teamB) {
                                                setScoringMatchId(match.matchId);
                                            }
                                        }}
                                    >
                                        {isFinale && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white rounded-full p-1.5 shadow-md border-2 border-white z-20">
                                                <Trophy size={16} fill="currentColor" />
                                            </div>
                                        )}

                                        {match.isBye && <span className="absolute top-1 right-2 text-[8px] md:text-[10px] font-bold text-gray-400">BYE</span>}
                                        {match.status !== 'completed' && teamA && teamB && (
                                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow animate-pulse z-10">
                                                <Play size={10} fill="currentColor" />
                                            </div>
                                        )}

                                        {/* Team A */}
                                        <div className={`flex justify-between items-center ${isDecided && match.winnerId !== teamA?.id ? 'opacity-40' : ''}`}>
                                            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                                {teamA ? (
                                                    <>
                                                        <div className={`relative ${isFinale && match.winnerId === teamA?.id ? 'ring-2 ring-yellow-400 rounded-full' : ''}`}>
                                                            <img src={teamA.avatar} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200" />
                                                            {isFinale && match.winnerId === teamA?.id && <div className="absolute -top-1 -right-1 text-yellow-500"><Crown size={12} fill="currentColor"/></div>}
                                                        </div>
                                                        <span className={`text-xs md:text-sm font-bold truncate max-w-[80px] md:max-w-[120px] ${isFinale ? 'text-gray-900 text-sm md:text-base' : ''}`}>{teamA.name}</span>
                                                    </>
                                                ) : <span className="text-xs text-gray-400 italic">...</span>}
                                            </div>
                                            <span className={`font-bold font-mono ${isFinale ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>{match.scoreA ?? '-'}</span>
                                        </div>

                                        <div className={`h-px ${isFinale ? 'bg-yellow-200' : 'bg-gray-100'}`}></div>

                                        {/* Team B */}
                                        <div className={`flex justify-between items-center ${isDecided && match.winnerId !== teamB?.id ? 'opacity-40' : ''}`}>
                                            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                                {teamB ? (
                                                    <>
                                                        <div className={`relative ${isFinale && match.winnerId === teamB?.id ? 'ring-2 ring-yellow-400 rounded-full' : ''}`}>
                                                            <img src={teamB.avatar} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200" />
                                                            {isFinale && match.winnerId === teamB?.id && <div className="absolute -top-1 -right-1 text-yellow-500"><Crown size={12} fill="currentColor"/></div>}
                                                        </div>
                                                        <span className={`text-xs md:text-sm font-bold truncate max-w-[80px] md:max-w-[120px] ${isFinale ? 'text-gray-900 text-sm md:text-base' : ''}`}>{teamB.name}</span>
                                                    </>
                                                ) : <span className="text-xs text-gray-400 italic">...</span>}
                                            </div>
                                            <span className={`font-bold font-mono ${isFinale ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>{match.scoreB ?? '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
              })}
          </div>
      )
  }

  // --- Main View ---

  if (isCreating) {
      return (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-soft animate-[slideUp_0.3s_ease-out] mb-20">
              <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="text-gonect-primary" /> Nieuw Toernooi
              </h2>
              
              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Toernooi Naam</label>
                      <input 
                        className="w-full p-3 border rounded-xl font-bold text-gonect-primary outline-none focus:border-gonect-primary" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Vrijdagmiddag Cup"
                      />
                  </div>
                  
                  <div className="flex bg-gray-100 p-1 rounded-full">
                      <button onClick={() => setTeamType('1v1')} className={`flex-1 py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 ${teamType === '1v1' ? 'bg-white shadow text-black' : 'text-gray-500'}`}><User size={14}/> 1 vs 1</button>
                      <button onClick={() => setTeamType('2v2')} className={`flex-1 py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 ${teamType === '2v2' ? 'bg-white shadow text-black' : 'text-gray-500'}`}><Users size={14}/> 2 vs 2</button>
                  </div>

                  <div>
                       <div className="flex justify-between items-center mb-3">
                           <label className="text-xs font-bold uppercase text-gray-400">Selecteer Deelnemers ({selectedPlayerIds.length})</label>
                           <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">
                               {teamType === '1v1' ? `${selectedPlayerIds.length} Teams` : `${Math.floor(selectedPlayerIds.length / 2)} Teams`}
                           </span>
                       </div>
                       <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2">
                           {players.map(p => (
                               <div 
                                key={p.id} 
                                onClick={() => togglePlayer(p.id)}
                                className={`cursor-pointer p-2 rounded-lg border flex flex-col items-center text-center transition-all ${selectedPlayerIds.includes(p.id) ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-gray-50 border-gray-100 opacity-70 hover:opacity-100'}`}
                               >
                                   <img src={p.avatar} className="w-8 h-8 rounded-full mb-1" />
                                   <span className="text-[10px] font-bold truncate w-full">{p.name}</span>
                               </div>
                           ))}
                       </div>
                       <p className="text-[10px] text-gray-400 mt-2 italic">Selecteer minimaal {teamType === '1v1' ? '2 spelers' : '4 spelers'}.</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                      <button onClick={() => setIsCreating(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Annuleren</button>
                      <button onClick={handleCreate} disabled={!newName || selectedPlayerIds.length < 2} className="flex-1 py-3 bg-gonect-black text-white font-bold rounded-xl shadow-lg disabled:opacity-50">Start</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out] mb-24">
      
      {/* List / Header */}
      {!activeTournament ? (
          <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">Toernooien</h2>
                  <button onClick={() => setIsCreating(true)} className="bg-gonect-primary text-white px-4 py-2 rounded-full font-bold shadow hover:bg-green-600 flex items-center gap-2">
                      <Plus size={18} /> <span className="hidden md:inline">Nieuw</span>
                  </button>
              </div>
              
              {tournaments.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
                      <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-500 font-medium">Nog geen toernooien gespeeld.</p>
                      <button onClick={() => setIsCreating(true)} className="mt-4 text-gonect-primary font-bold">Start je eerste toernooi</button>
                  </div>
              ) : (
                  <div className="grid gap-4">
                      {tournaments.map(t => (
                          <div key={t.id} onClick={() => setActiveTournament(t)} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group relative">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h3 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-gonect-primary transition-colors">{t.name}</h3>
                                      <div className="text-xs text-gray-400 mt-1 flex gap-2 md:gap-3 flex-wrap">
                                          <span>{new Date(t.date).toLocaleDateString()}</span>
                                          <span>• {t.teams.length} teams</span>
                                          <span className="uppercase font-bold text-orange-400">
                                              {t.status === 'knockout_stage' ? 'Knock-out' : t.status}
                                          </span>
                                      </div>
                                  </div>
                                  {t.status === 'completed' && t.winnerTeamId && (
                                      <div className="text-right">
                                          <div className="text-[10px] uppercase font-bold text-gray-400">Winnaar</div>
                                          <div className="font-bold text-gonect-black flex items-center gap-1 justify-end">
                                              <Crown size={12} className="text-yellow-500" fill="currentColor" />
                                              <span className="text-sm">{t.teams.find(tm => tm.id === t.winnerTeamId)?.name}</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                              <div className="absolute top-4 right-4 z-10">
                                  {deleteConfirmId === t.id ? (
                                      <button 
                                          onClick={(e) => handleDelete(e, t.id)}
                                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold shadow-md animate-pulse hover:bg-red-600 transition-colors flex items-center gap-1"
                                      >
                                          <AlertTriangle size={12} /> <span className="hidden md:inline">Zeker?</span>
                                      </button>
                                  ) : (
                                      <button 
                                          onClick={(e) => handleDelete(e, t.id)}
                                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      ) : (
          <div className="max-w-6xl mx-auto">
              {/* Active Tournament View */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveTournament(null)} className="p-2 bg-white rounded-full shadow hover:bg-gray-50">
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-none">{activeTournament.name}</h2>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-full font-bold bg-gonect-black text-white">
                            <GitBranch size={10} className="inline mr-1"/> Bracket
                            </span>
                        </div>
                    </div>
                  </div>
                  
                  {/* Delete active tournament button */}
                   <div className="ml-auto">
                        {deleteConfirmId === activeTournament.id ? (
                            <button 
                                onClick={(e) => handleDelete(e, activeTournament.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow-md hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <AlertTriangle size={16} /> <span className="hidden md:inline">Verwijder Toernooi?</span> <span className="md:hidden">Wis</span>
                            </button>
                        ) : (
                            <button 
                                onClick={(e) => handleDelete(e, activeTournament.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                title="Verwijder Toernooi"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                   </div>
              </div>

              {/* Tournament Container */}
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 overflow-hidden min-h-[400px]">
                  {renderBracket(activeTournament)}
              </div>
          </div>
      )}

      {/* Scoring Modal */}
      {scoringMatchId && activeTournament && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                  <h3 className="text-center font-bold text-lg mb-6">Uitslag Invoeren</h3>
                  
                  {(() => {
                      let match = activeTournament.bracket.find(m => m.matchId === scoringMatchId);
                      
                      const teamA = activeTournament.teams.find(t => t.id === match?.teamAId);
                      const teamB = activeTournament.teams.find(t => t.id === match?.teamBId);
                      
                      return (
                          <form onSubmit={handleScoreSubmit}>
                              <div className="flex justify-between items-center mb-8 gap-4">
                                  <div className="flex-1 text-center">
                                      <img src={teamA?.avatar} className="w-12 h-12 rounded-full mx-auto mb-2 bg-gray-200" />
                                      <div className="text-xs font-bold truncate max-w-[80px] mx-auto">{teamA?.name}</div>
                                      <input 
                                        autoFocus
                                        type="number" 
                                        value={scoreA} 
                                        onChange={e => setScoreA(e.target.value)} 
                                        className="mt-2 w-16 text-center p-2 border-2 border-blue-100 rounded-lg font-bold text-xl text-gonect-primary outline-none focus:border-blue-500"
                                      />
                                  </div>
                                  <div className="font-black text-gray-300 text-xl">VS</div>
                                  <div className="flex-1 text-center">
                                      <img src={teamB?.avatar} className="w-12 h-12 rounded-full mx-auto mb-2 bg-gray-200" />
                                      <div className="text-xs font-bold truncate max-w-[80px] mx-auto">{teamB?.name}</div>
                                      <input 
                                        type="number" 
                                        value={scoreB} 
                                        onChange={e => setScoreB(e.target.value)} 
                                        className="mt-2 w-16 text-center p-2 border-2 border-orange-100 rounded-lg font-bold text-xl text-gonect-primary outline-none focus:border-orange-500"
                                      />
                                  </div>
                              </div>
                              <div className="flex gap-3">
                                  <button type="button" onClick={() => setScoringMatchId(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Annuleren</button>
                                  <button type="submit" className="flex-1 py-3 bg-gonect-primary text-white font-bold rounded-xl shadow-lg">Opslaan</button>
                              </div>
                          </form>
                      )
                  })()}
              </div>
          </div>
      )}

      {/* --- CHAMPIONSHIP CELEBRATION OVERLAY --- */}
      {showCelebration && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center animate-[fadeIn_0.5s_ease-out] p-4">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                   {/* CSS Confetti/Particles (Simple CSS implementation) */}
                   {[...Array(20)].map((_, i) => (
                       <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
                            style={{ 
                                top: `${Math.random() * 100}%`, 
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                transform: `scale(${Math.random() * 2})` 
                            }}>
                       </div>
                   ))}
              </div>

              <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center shadow-[0_0_100px_rgba(250,204,21,0.5)] border-4 border-yellow-400 max-w-lg w-full relative animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                  <div className="absolute -top-6 md:-top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-6 md:px-8 py-2 rounded-full font-black text-sm md:text-xl uppercase tracking-widest shadow-lg flex items-center gap-2 border-4 border-white whitespace-nowrap">
                      <Crown fill="currentColor" size={18} /> Kampioenen
                  </div>
                  
                  <div className="mb-6 md:mb-8 mt-4 md:mt-4">
                      <div className="flex justify-center -space-x-4 mb-4">
                          {showCelebration.playerIds.map((pid) => {
                              const p = players.find(pl => pl.id === pid);
                              return (
                                <img key={pid} src={p?.avatar} className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl bg-gray-200" />
                              )
                          })}
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-gray-800">{showCelebration.name}</h2>
                  </div>

                  <div className="space-y-4">
                      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                          <div className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Gewonnen Prijs</div>
                          <div className="text-2xl md:text-3xl font-black text-gray-800 flex items-center justify-center gap-2">
                              <Zap className="text-yellow-500" fill="currentColor" />
                              +100 ELO
                          </div>
                      </div>
                      <p className="text-gray-400 italic font-medium text-sm md:text-base">"Eeuwige roem en de titel van de maand!"</p>
                  </div>

                  <button 
                    onClick={() => setShowCelebration(null)}
                    className="mt-6 md:mt-8 px-8 md:px-10 py-3 md:py-4 bg-gonect-black text-white rounded-full font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform w-full md:w-auto"
                  >
                      Sluiten
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default TournamentView;
