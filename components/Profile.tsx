
import React, { useState, useEffect, useRef } from 'react';
import { Player, Match } from '../types';
import { getLevelTitle, getLevelColor, BADGES } from '../constants';
import { updatePlayerProfile } from '../services/eloService';
import { X, TrendingUp, TrendingDown, Target, Footprints, Trash2, Edit2, Save, User, Camera, Crown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileProps {
  player: Player;
  matches: Match[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate?: () => void; // Callback to refresh data in App
}

const Profile: React.FC<ProfileProps> = ({ player, matches, onClose, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editNickname, setEditNickname] = useState(player.nickname || '');
  const [editAvatar, setEditAvatar] = useState(player.avatar);
  const [editDept, setEditDept] = useState(player.department || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if player prop updates (e.g. after save)
  useEffect(() => {
    setEditName(player.name);
    setEditNickname(player.nickname || '');
    setEditAvatar(player.avatar);
    setEditDept(player.department || '');
  }, [player]);

  const level = getLevelTitle(player.rating);
  const badgeColor = getLevelColor(level);

  // Filter matches involving this player
  const playerMatches = matches.filter(m => 
    m.teamAIds.includes(player.id) || m.teamBIds.includes(player.id)
  );

  // Generate chart data (mocking history by reversing rating changes)
  const chartData = [];
  let currentRating = player.rating;
  
  chartData.push({ name: 'Nu', rating: currentRating });
  
  const recentMatches = playerMatches.slice(0, 10);
  for(const m of recentMatches) {
    const isTeamA = m.teamAIds.includes(player.id);
    const delta = isTeamA ? m.ratingDeltaA : m.ratingDeltaB;
    currentRating -= delta; // Go backwards
    chartData.unshift({ name: new Date(m.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}), rating: currentRating });
  }

  const handleDelete = () => {
    if (window.confirm(`Weet je zeker dat je ${player.name} wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`)) {
        onDelete(player.id);
        onClose();
    }
  };

  const handleSave = () => {
    updatePlayerProfile(player.id, {
        name: editName,
        nickname: editNickname,
        avatar: editAvatar,
        department: editDept
    });
    setIsEditing(false);
    if (onUpdate) onUpdate();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-[fadeIn_0.3s_ease-out] border-0 flex flex-col md:flex-row">
        
        {/* Close Button - Sticky on Mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100/80 backdrop-blur rounded-full hover:bg-gray-200 transition-colors z-20"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Sidebar Info */}
        <div className="w-full md:w-1/3 bg-gray-50/80 p-6 md:p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100 relative">
            
            <div className="absolute top-4 left-4 z-10">
                 {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-gonect-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                        <Edit2 size={16} /> Edit
                    </button>
                 ) : (
                    <button onClick={handleSave} className="p-2 text-white bg-gonect-primary rounded-lg shadow-md hover:bg-green-600 transition-all flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                        <Save size={16} /> Opslaan
                    </button>
                 )}
            </div>

            <div className="relative mt-8 group">
              <div 
                className={`w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gonect-primary ${isEditing ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                 <img 
                    src={isEditing ? editAvatar : player.avatar} 
                    alt={player.name} 
                    className="w-full h-full rounded-full border-4 border-white shadow-lg object-cover" 
                 />
                 {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                 )}
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden" 
                    onChange={handleImageUpload}
                 />
              </div>
              <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md whitespace-nowrap bg-white ${badgeColor}`}>
                {level}
              </span>
            </div>
            
            {isEditing ? (
                <div className="mt-8 w-full space-y-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Naam</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white text-gonect-primary font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Bijnaam</label>
                        <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white text-gonect-primary font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Afdeling</label>
                        <input type="text" value={editDept} onChange={e => setEditDept(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white text-gonect-primary font-bold" />
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <h2 className="mt-6 md:mt-8 text-2xl md:text-3xl font-bold text-gonect-black tracking-tight">{player.name}</h2>
                    {player.nickname && <p className="text-gonect-primary font-bold text-base md:text-lg italic">"{player.nickname}"</p>}
                    <p className="text-gray-500 font-medium mt-1 text-sm">{player.department}</p>
                </div>
            )}
            
            <div className="mt-6 w-full bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold uppercase">Huidige Rating</span>
                <span className="text-lg font-bold text-gonect-primary">{player.rating}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-6 w-full">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Achievements</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {BADGES.map(badge => {
                  const hasBadge = badge.condition(player);
                  return (
                    <div 
                      key={badge.id} 
                      className={`group relative p-2.5 rounded-xl text-xl border transition-all ${hasBadge ? 'bg-yellow-50 border-yellow-200 text-yellow-600 shadow-sm' : 'bg-white border-gray-200 text-gray-300 grayscale'}`}
                    >
                      {badge.icon}
                      {hasBadge && (
                         // Tooltip logic adjusted for mobile (centered)
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gonect-black text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                          <p className="font-bold text-yellow-400 mb-0.5">{badge.name}</p>
                          <p className="text-gray-300 leading-tight">{badge.description}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

             <div className="mt-auto w-full pt-6 border-t border-gray-200 hidden md:block">
                <button 
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 text-red-500 hover:text-red-700 text-sm font-semibold w-full py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={16} /> Verwijder Speler
                </button>
            </div>
        </div>

        {/* Main Stats Area */}
        <div className="w-full md:w-2/3 p-6 md:p-8 bg-white/40">
            <h3 className="text-lg md:text-xl font-bold text-gonect-black mb-4 md:mb-6 flex items-center gap-2">
                <TrendingUp className="text-gonect-primary" /> Statistieken
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="p-3 md:p-4 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-1 md:gap-2 text-green-600 mb-1 text-[10px] md:text-xs uppercase font-bold"><TrendingUp size={12}/> Winst</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{player.wins}</div>
              </div>
              <div className="p-3 md:p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-1 md:gap-2 text-red-600 mb-1 text-[10px] md:text-xs uppercase font-bold"><TrendingDown size={12}/> Verlies</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{player.losses}</div>
              </div>
               <div className="p-3 md:p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-1 md:gap-2 text-blue-600 mb-1 text-[10px] md:text-xs uppercase font-bold"><Target size={12}/> Goals</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{player.goalsFor}</div>
              </div>
              {/* CRAWL COUNTER */}
              <div className="p-3 md:p-4 bg-pink-50 rounded-2xl border border-pink-100 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-1 md:gap-2 text-pink-600 mb-1 text-[10px] md:text-xs uppercase font-bold"><Footprints size={12}/> Kruip</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-800">{player.crawls || 0}</div>
              </div>
              
              {/* TOURNAMENT WINS CARD */}
              <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm flex flex-col items-center md:items-start text-center md:text-left col-span-2 lg:col-span-4 lg:flex-row lg:justify-between lg:items-center">
                 <div className="flex items-center gap-2 text-yellow-600 mb-2 lg:mb-0 text-xs uppercase font-bold">
                    <Crown size={16} fill="currentColor" className="text-yellow-500" /> Kampioenschappen
                 </div>
                 <div className="flex items-baseline gap-1">
                     <span className="text-2xl md:text-3xl font-black text-gray-800">{player.tournamentWins || 0}</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase">Keer</span>
                 </div>
              </div>

            </div>

            {/* Rating Graph (Still keep it, nice on mobile landscape or larger phones) */}
            <div className="h-48 md:h-64 w-full mb-8 bg-white/60 rounded-2xl p-2 md:p-4 border border-gray-100">
              <h4 className="text-[10px] md:text-xs font-bold text-gray-400 mb-4 uppercase text-center md:text-left">Rating Verloop</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DB34A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2DB34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5"/>
                  <XAxis dataKey="name" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#000', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} 
                    itemStyle={{ color: '#2DB34A' }}
                  />
                  <Area type="monotone" dataKey="rating" stroke="#2DB34A" strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Match History */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase text-center md:text-left">Recente Wedstrijden</h4>
              <div className="space-y-3">
                {playerMatches.slice(0, 5).map(match => {
                   const isTeamA = match.teamAIds.includes(player.id);
                   const isWinner = (isTeamA && match.scoreA > match.scoreB) || (!isTeamA && match.scoreB > match.scoreA);
                   const delta = isTeamA ? match.ratingDeltaA : match.ratingDeltaB;
                   
                   return (
                     <div key={match.id} className="flex justify-between items-center p-3 md:p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-8 md:w-1.5 md:h-10 rounded-full ${isWinner ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-900 tracking-wide">
                                {isTeamA ? `${match.scoreA} - ${match.scoreB}` : `${match.scoreB} - ${match.scoreA}`}
                            </div>
                            <div className="text-[9px] md:text-[10px] text-gray-400 uppercase font-semibold">{new Date(match.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className={`font-bold text-base md:text-lg ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {delta > 0 ? '+' : ''}{delta}
                        </div>
                     </div>
                   );
                })}
                {playerMatches.length === 0 && <p className="text-gray-400 italic text-center py-4 text-xs">Nog geen wedstrijden gespeeld.</p>}
              </div>
            </div>

            {/* Mobile Delete Button (Bottom) */}
            <div className="mt-8 md:hidden">
                <button 
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 text-red-500 hover:text-red-700 text-sm font-semibold w-full py-3 bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={16} /> Verwijder Speler
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
