
import React, { useState, useEffect } from 'react';
import { Player, Match, MatchPrefillData } from './types';
import { getPlayers, getMatches, createPlayer, deletePlayer } from './services/eloService';
import { getLevelTitle, getLevelColor } from './constants';
import MatchEntry from './components/MatchEntry';
import Profile from './components/Profile';
import TeamGenerator from './components/TeamGenerator';
import MatchHistory from './components/MatchHistory';
import PlayerManagement from './components/PlayerManagement';
import TournamentView from './components/TournamentView';
import { LayoutGrid, PlusCircle, Award, Crown, TrendingUp, Sparkles, Footprints, History, UserCog, Trophy, ArrowUp, Swords } from 'lucide-react';

// Custom CSS Logo Component (Slightly refined for the new header)
const GonectLogo = () => (
  <div className="flex items-center relative py-2 select-none scale-75 md:scale-90 origin-left">
    {/* Rod Background */}
    <div className="absolute left-[-12%] right-[-12%] top-[52%] -translate-y-1/2 h-2.5 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-500 border-t border-gray-400/50 shadow-sm z-0 rounded-sm"></div>
    
    {/* Bumper Left */}
    <div className="absolute left-[-8%] top-[52%] -translate-y-1/2 w-2 h-4 bg-gonect-primary border-r border-black/20 rounded-sm z-0 shadow-sm"></div>

    <span className="text-3xl font-black text-gonect-primary tracking-tighter relative z-10 leading-none drop-shadow-sm" style={{ textShadow: '1px 1px 0px #fff' }}>GO</span>
    
    <div className="relative z-20 flex flex-col items-center -my-3 mx-1">
      <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-sm mb-0.5 relative z-10 border border-red-800/20"></div>
      <div className="w-6 h-7 bg-gradient-to-r from-red-600 to-red-500 rounded-t-lg rounded-b-md shadow-md border-b-2 border-red-900 relative flex justify-center z-10">
        <div className="absolute top-1/2 w-full h-[1px] bg-red-900/30"></div>
      </div>
      <div className="w-4 h-2 bg-red-800 rounded-b-md z-10 shadow-sm"></div>
      <div className="absolute -bottom-2.5 w-4 h-4 bg-white rounded-full border border-gray-900 shadow-md flex items-center justify-center overflow-hidden z-20">
         <div className="absolute w-[120%] h-[1px] bg-gray-900 rotate-45"></div>
         <div className="absolute w-[1px] h-[120%] bg-gray-900 -rotate-12"></div>
      </div>
    </div>

    <span className="text-3xl font-black text-gray-800 tracking-tighter relative z-10 leading-none drop-shadow-sm" style={{ textShadow: '1px 1px 0px #fff' }}>NECT</span>
    
    {/* Bumper Right */}
    <div className="absolute right-[-8%] top-[52%] -translate-y-1/2 w-2 h-4 bg-gonect-primary border-l border-black/20 rounded-sm z-0 shadow-sm"></div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'match' | 'history' | 'generator' | 'management' | 'tournament'>('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month'>('all');
  
  // State to pass generated teams to the match entry form
  const [prefillMatchData, setPrefillMatchData] = useState<MatchPrefillData | null>(null);

  const viewingPlayer = viewingPlayerId ? players.find(p => p.id === viewingPlayerId) || null : null;

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPlayers(getPlayers());
    setMatches(getMatches());
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    refreshData();
    setActiveTab('leaderboard');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeletePlayer = (id: string) => {
      deletePlayer(id);
      setViewingPlayerId(null);
      refreshData();
  }

  const handleStartMatch = (data: MatchPrefillData) => {
    setPrefillMatchData(data);
    setActiveTab('match');
  };

  // --- Filter Logic ---
  const getFilteredPlayers = () => {
    if (timeFilter === 'all') {
      return [...players].sort((a, b) => b.rating - a.rating);
    }
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyGains = new Map<string, number>();
    players.forEach(p => monthlyGains.set(p.id, 0));

    matches.forEach(m => {
      const d = new Date(m.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
         m.teamAIds.forEach(id => monthlyGains.set(id, (monthlyGains.get(id) || 0) + m.ratingDeltaA));
         m.teamBIds.forEach(id => monthlyGains.set(id, (monthlyGains.get(id) || 0) + m.ratingDeltaB));
      }
    });

    return [...players]
      .map(p => ({ ...p, monthlyRating: monthlyGains.get(p.id) || 0 }))
      .sort((a, b) => b.monthlyRating - a.monthlyRating);
  };

  const sortedPlayers = getFilteredPlayers();
  const top3 = sortedPlayers.slice(0, 3);
  const restOfPlayers = sortedPlayers.slice(3);
  const crawlers = [...players].filter(p => p.crawls > 0).sort((a, b) => b.crawls - a.crawls);

  // Helper to calculate points needed to overtake next rank
  const getPointsDiff = (playerRating: number, targetRating: number) => {
    return Math.max(0, targetRating - playerRating + 1);
  };

  return (
    <div className="min-h-screen pb-32 md:pb-0 text-gonect-text selection:bg-gonect-primary selection:text-white overflow-x-hidden">
      
      {/* --- Modern Header Navigation --- */}
      <nav className="glass-panel sticky top-4 mx-4 md:mx-auto max-w-7xl z-40 rounded-full shadow-lg border-opacity-40">
        <div className="px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-2 md:gap-4">
              <GonectLogo />
              <div className="flex flex-col leading-none border-l border-gray-300 pl-3 md:pl-4 h-8 justify-center opacity-80">
                 <span className="font-bold text-xs md:text-sm tracking-tight text-gonect-dark">De Dagelijkse</span>
                 <span className="font-bold text-[8px] md:text-[10px] text-gonect-primary uppercase tracking-widest">Derby</span>
              </div>
            </div>
            
            {/* Pill Navigation (Desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-full border border-white/50 shadow-inner">
               {[
                 { id: 'leaderboard', label: 'Rankings', icon: <Trophy size={16} /> },
                 { id: 'match', label: 'Wedstrijd', icon: <PlusCircle size={16} /> },
                 { id: 'tournament', label: 'Toernooien', icon: <Swords size={16} /> },
                 { id: 'history', label: 'Historie', icon: <History size={16} /> },
                 { id: 'generator', label: 'Teams', icon: <Sparkles size={16} /> },
                 { id: 'management', label: 'Beheer', icon: <UserCog size={16} /> }
               ].map((item) => (
                 <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === item.id ? 'bg-gonect-dark text-white shadow-lg scale-100' : 'text-gray-500 hover:text-gonect-dark hover:bg-white'}`}
                 >
                   {item.icon}
                   {item.label}
                 </button>
               ))}
            </div>

            {/* Mobile Menu Placeholder (Empty as we use bottom nav) */}
            <div className="md:hidden"></div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        
        {notification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gonect-black text-white px-6 py-3 rounded-full shadow-2xl animate-[slideIn_0.3s_ease-out] border border-gray-700 flex items-center gap-3 w-11/12 max-w-md justify-center">
             <div className="bg-gonect-primary p-1 rounded-full text-white shadow-glow"><Award size={16} /></div>
            <span className="font-bold text-xs md:text-sm tracking-wide truncate">{notification}</span>
          </div>
        )}

        {/* --- Leaderboard View --- */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8 md:space-y-12 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Time Filter Toggle */}
            <div className="flex justify-center mb-4 md:mb-8">
              <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-full shadow-inner scale-90 md:scale-100">
                <button 
                  onClick={() => setTimeFilter('all')}
                  className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${timeFilter === 'all' ? 'bg-white text-gonect-dark shadow-md' : 'text-white/70 hover:text-white'}`}
                >
                  Totaal
                </button>
                <button 
                  onClick={() => setTimeFilter('month')}
                  className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${timeFilter === 'month' ? 'bg-white text-gonect-dark shadow-md' : 'text-white/70 hover:text-white'}`}
                >
                  Maand
                </button>
              </div>
            </div>

            {/* --- PODIUM CARDS (Mobile: Stacked/Grid | Desktop: Flex Row) --- */}
            {top3.length > 0 && (
              <div className="flex flex-col md:flex-row justify-center items-end gap-6 md:gap-8 min-h-0 md:min-h-[400px]">
                
                {/* Rank 1 Card (Mobile: Full Width Top) */}
                {top3[0] && (
                  <div onClick={() => setViewingPlayerId(top3[0].id)} className="order-1 md:order-2 glass-panel rounded-[2rem] p-6 w-full md:w-[340px] flex flex-col items-center glass-card-hover cursor-pointer relative z-10 border-t-4 border-t-yellow-400 shadow-2xl">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <Crown size={48} className="text-yellow-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]" fill="currentColor" />
                    </div>
                    <div className="mb-4 relative mt-2">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1.5 bg-gonect-gradient shadow-2xl ring-4 ring-green-100/50">
                            <img src={top3[0].avatar} className="w-full h-full rounded-full object-cover border-4 border-white" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gonect-primary text-white px-4 py-1 rounded-full shadow-lg text-sm font-black border-2 border-white">#1</div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900">{top3[0].name}</h3>
                    <span className="text-xs md:text-sm font-bold text-gonect-primary uppercase tracking-widest mb-4">{top3[0].nickname || 'Champion'}</span>
                    <div className="text-5xl md:text-6xl font-black text-gonect-primary drop-shadow-sm mb-2">
                         {timeFilter === 'all' ? top3[0].rating : (top3[0] as any).monthlyRating}
                    </div>
                     <span className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest">Huidige Leider</span>
                  </div>
                )}

                {/* Mobile Grid for Rank 2 & 3 */}
                <div className="order-2 w-full grid grid-cols-2 gap-4 md:contents">
                    {/* Rank 2 Card */}
                    {top3[1] && (
                      <div onClick={() => setViewingPlayerId(top3[1].id)} className="md:order-1 glass-panel rounded-2xl p-4 md:p-6 w-full md:w-[280px] flex flex-col items-center glass-card-hover cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-300 to-gray-400"></div>
                        <div className="mb-3 relative">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-tr from-gray-300 to-white shadow-lg">
                                <img src={top3[1].avatar} className="w-full h-full rounded-full object-cover border-2 md:border-4 border-white" />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-md text-[10px] md:text-xs font-black text-gray-500 border border-gray-100">#2</div>
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-gray-800 truncate w-full text-center">{top3[1].name}</h3>
                        <div className="text-2xl md:text-4xl font-black text-gray-600 mb-1">
                            {timeFilter === 'all' ? top3[1].rating : (top3[1] as any).monthlyRating}
                        </div>
                         <div className="mt-auto pt-2 border-t border-gray-100 w-full flex justify-center items-center gap-1 text-[10px] md:text-xs font-medium text-gray-400">
                            <ArrowUp size={10} className="text-gray-300"/>
                            <span>{getPointsDiff((timeFilter === 'all' ? top3[1].rating : (top3[1] as any).monthlyRating), (timeFilter === 'all' ? top3[0].rating : (top3[0] as any).monthlyRating))} pnt</span>
                        </div>
                      </div>
                    )}

                    {/* Rank 3 Card */}
                    {top3[2] && (
                       <div onClick={() => setViewingPlayerId(top3[2].id)} className="md:order-3 glass-panel rounded-2xl p-4 md:p-6 w-full md:w-[280px] flex flex-col items-center glass-card-hover cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-300 to-orange-400"></div>
                        <div className="mb-3 relative">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-tr from-orange-200 to-white shadow-lg">
                                <img src={top3[2].avatar} className="w-full h-full rounded-full object-cover border-2 md:border-4 border-white" />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-md text-[10px] md:text-xs font-black text-gray-500 border border-gray-100">#3</div>
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-gray-800 truncate w-full text-center">{top3[2].name}</h3>
                        <div className="text-2xl md:text-4xl font-black text-orange-400 mb-1">
                           {timeFilter === 'all' ? top3[2].rating : (top3[2] as any).monthlyRating}
                        </div>
                         <div className="mt-auto pt-2 border-t border-gray-100 w-full flex justify-center items-center gap-1 text-[10px] md:text-xs font-medium text-gray-400">
                            <ArrowUp size={10} className="text-gray-300"/>
                            <span>{getPointsDiff((timeFilter === 'all' ? top3[2].rating : (top3[2] as any).monthlyRating), (timeFilter === 'all' ? top3[1].rating : (top3[1] as any).monthlyRating))} pnt</span>
                        </div>
                      </div>
                    )}
                </div>

              </div>
            )}

            {/* --- CRAWLER RAIL (Kruip Koningen - Moving Animation) --- */}
            {crawlers.length > 0 && (
              <div className="max-w-5xl mx-auto mb-12 animate-[slideUp_0.5s_ease-out] overflow-hidden">
                 {/* Rail Container */}
                 <div className="relative glass-panel rounded-full p-2 h-24 md:h-28 flex items-center shadow-lg border border-white/40 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-pink-500 text-white text-[10px] font-bold px-3 md:px-4 flex items-center shadow-md z-20 rounded-l-full">
                        <div className="flex flex-col items-center gap-1">
                          <Footprints size={12} className="animate-pulse" />
                          <span className="writing-vertical-lr">KRUIP!</span>
                        </div>
                    </div>
                    
                    {/* The Track with Gradient Fade on Edges */}
                    <div className="absolute left-10 md:left-12 right-0 top-0 bottom-0 overflow-hidden">
                       <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10"></div>
                       <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10"></div>
                       
                       {/* Animated Inner Container */}
                       <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-8 md:gap-12 animate-crawl">
                          {crawlers.map((p, idx) => (
                             <div key={p.id} onClick={() => setViewingPlayerId(p.id)} className="relative group cursor-pointer flex-shrink-0">
                                {/* Crawl Posture / Rotation */}
                                <div className="transform -rotate-12 transition-transform hover:rotate-0">
                                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-pink-200 shadow-md bg-gray-100 overflow-hidden relative z-10">
                                      <img src={p.avatar} className="w-full h-full object-cover grayscale opacity-90" />
                                      {/* Crying Tears Overlay */}
                                      <div className="absolute top-6 left-5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-tear"></div>
                                      <div className="absolute top-6 right-5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-tear-delay"></div>
                                  </div>
                                </div>
                                <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border border-white z-20 shadow-sm">
                                    {p.crawls}
                                </div>
                                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 bg-white/80 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                                    {p.name}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* --- The Rest (List) --- */}
            {restOfPlayers.length > 0 && (
              <div className="max-w-4xl mx-auto pb-10">
                <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                        <tr>
                          <th className="px-4 md:px-8 py-4">Rang</th>
                          <th className="px-4 md:px-6 py-4">Speler</th>
                          <th className="px-6 py-4 hidden sm:table-cell">Niveau</th>
                          <th className="px-4 md:px-8 py-4 text-right">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100/50">
                        {restOfPlayers.map((player, index) => {
                          const realRank = index + 4;
                          const level = getLevelTitle(player.rating);
                          const levelColor = getLevelColor(level);

                          return (
                            <tr 
                              key={player.id} 
                              onClick={() => setViewingPlayerId(player.id)}
                              className="hover:bg-green-50/30 cursor-pointer transition-colors group"
                            >
                              <td className="px-4 md:px-8 py-3 md:py-4 whitespace-nowrap">
                                <span className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold text-xs shadow-inner">#{realRank}</span>
                              </td>
                              <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover border-2 border-white shadow-sm" src={player.avatar} alt="" />
                                  <div className="ml-3 md:ml-4 flex flex-col">
                                    <div className="text-sm font-bold text-gray-800">{player.name}</div>
                                    {player.nickname && <div className="text-[10px] md:text-xs text-gonect-primary italic font-medium hidden xs:block">{player.nickname}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${levelColor}`}>
                                  {level}
                                </span>
                              </td>
                              <td className="px-4 md:px-8 py-3 md:py-4 whitespace-nowrap text-right">
                                <div className="text-base md:text-lg font-black text-gonect-dark">
                                  {timeFilter === 'all' ? player.rating : (player as any).monthlyRating}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Match View --- */}
        {activeTab === 'match' && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <MatchEntry 
              players={players} 
              onMatchRecorded={showNotification} 
              prefillData={prefillMatchData}
            />
          </div>
        )}

        {/* --- Tournament View --- */}
        {activeTab === 'tournament' && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <TournamentView players={players} onUpdate={refreshData} />
          </div>
        )}

        {/* --- History View --- */}
        {activeTab === 'history' && (
           <div className="animate-[slideUp_0.3s_ease-out]">
              <MatchHistory matches={matches} players={players} onMatchesChanged={refreshData} />
           </div>
        )}

        {/* --- Generator View --- */}
        {activeTab === 'generator' && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <TeamGenerator players={players} onStartMatch={handleStartMatch} />
          </div>
        )}

        {/* --- Management View --- */}
        {activeTab === 'management' && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <PlayerManagement players={players} onUpdate={refreshData} />
          </div>
        )}

      </main>

      {/* --- Mobile Bottom Nav (Optimized) --- */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 h-16 glass-panel rounded-2xl flex justify-between items-center z-50 shadow-2xl border-white/50 px-2">
        <button 
          onClick={() => setActiveTab('leaderboard')} 
          className={`flex flex-col items-center justify-center w-14 h-full rounded-xl transition-all ${activeTab === 'leaderboard' ? 'text-gonect-primary bg-green-50' : 'text-gray-400'}`}
        >
          <Trophy size={20} />
          <span className="text-[9px] font-bold mt-1">Ranking</span>
        </button>

         <button 
          onClick={() => setActiveTab('tournament')} 
          className={`flex flex-col items-center justify-center w-14 h-full rounded-xl transition-all ${activeTab === 'tournament' ? 'text-gonect-primary bg-green-50' : 'text-gray-400'}`}
        >
          <Swords size={20} />
          <span className="text-[9px] font-bold mt-1">Cups</span>
        </button>
        
        {/* Main Action Button (Floating) */}
        <button 
          onClick={() => setActiveTab('match')} 
          className={`relative -top-6 bg-gonect-dark text-white w-14 h-14 rounded-full shadow-glow border-4 border-[#eef2f6] flex items-center justify-center active:scale-95 transition-transform`}
        >
          <PlusCircle size={28} />
        </button>
        
        <button 
          onClick={() => setActiveTab('generator')} 
          className={`flex flex-col items-center justify-center w-14 h-full rounded-xl transition-all ${activeTab === 'generator' ? 'text-gonect-primary bg-green-50' : 'text-gray-400'}`}
        >
          <Sparkles size={20} />
          <span className="text-[9px] font-bold mt-1">Teams</span>
        </button>

        <button 
          onClick={() => setActiveTab('management')} 
          className={`flex flex-col items-center justify-center w-14 h-full rounded-xl transition-all ${activeTab === 'management' ? 'text-gonect-primary bg-green-50' : 'text-gray-400'}`}
        >
          <UserCog size={20} />
          <span className="text-[9px] font-bold mt-1">Beheer</span>
        </button>
      </div>

      {/* --- Modals --- */}
      {viewingPlayer && (
        <Profile 
          player={viewingPlayer} 
          matches={matches} 
          onClose={() => setViewingPlayerId(null)} 
          onDelete={handleDeletePlayer}
          onUpdate={refreshData}
        />
      )}

    </div>
  );
}

export default App;
