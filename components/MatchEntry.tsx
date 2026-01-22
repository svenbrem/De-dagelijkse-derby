
import React, { useState, useEffect } from 'react';
import { Player, MatchPrefillData } from '../types';
import { recordMatch } from '../services/eloService';
import { Users, User, Trophy, Save } from 'lucide-react';

interface MatchEntryProps {
  players: Player[];
  onMatchRecorded: (message: string) => void;
  prefillData?: MatchPrefillData | null;
}

const MatchEntry: React.FC<MatchEntryProps> = ({ players, onMatchRecorded, prefillData }) => {
  const [matchType, setMatchType] = useState<'1v1' | '2v2'>('1v1');
  
  const [teamA1, setTeamA1] = useState<string>('');
  const [teamA2, setTeamA2] = useState<string>('');
  const [teamB1, setTeamB1] = useState<string>('');
  const [teamB2, setTeamB2] = useState<string>('');
  
  const [scoreA, setScoreA] = useState<string>('');
  const [scoreB, setScoreB] = useState<string>('');

  const [loading, setLoading] = useState(false);

  // Auto-fill from generator data
  useEffect(() => {
    if (prefillData) {
      setMatchType(prefillData.type);
      setTeamA1(prefillData.teamAIds[0] || '');
      setTeamA2(prefillData.teamAIds[1] || '');
      setTeamB1(prefillData.teamBIds[0] || '');
      setTeamB2(prefillData.teamBIds[1] || '');
      setScoreA('');
      setScoreB('');
    }
  }, [prefillData]);

  // Sort players alphabetically for dropdowns
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamA1 || !teamB1 || (matchType === '2v2' && (!teamA2 || !teamB2))) {
      alert("Selecteer alle spelers.");
      return;
    }

    // Check for duplicates
    const selectedIds = [teamA1, teamB1, ...(matchType === '2v2' ? [teamA2, teamB2] : [])];
    const uniqueIds = new Set(selectedIds);
    if (selectedIds.length !== uniqueIds.size) {
      alert("Een speler kan niet twee keer geselecteerd worden.");
      return;
    }

    const sA = parseInt(scoreA);
    const sB = parseInt(scoreB);

    if (isNaN(sA) || isNaN(sB)) {
      alert("Vul een geldige score in.");
      return;
    }
    
    if (sA === sB) {
        alert("Gelijkspel bestaat niet bij tafelvoetbal. Iemand moet winnen!");
        return;
    }

    setLoading(true);

    const teamAIds = matchType === '2v2' ? [teamA1, teamA2] : [teamA1];
    const teamBIds = matchType === '2v2' ? [teamB1, teamB2] : [teamB1];

    // Simulate network delay for effect
    setTimeout(() => {
      const { updatedPlayers } = recordMatch(teamAIds, teamBIds, sA, sB, matchType);
      
      let msg = `Match opgeslagen! Team ${sA > sB ? 'Blauw' : 'Oranje'} Wint!`;
      if (sA === 0 || sB === 0) {
          msg += " 👶 Iemand moet kruipen!";
      }

      onMatchRecorded(msg);
      
      // Reset form (don't clear prefill prop, but clear local state)
      setScoreA('');
      setScoreB('');
      setTeamA1('');
      setTeamA2('');
      setTeamB1('');
      setTeamB2('');
      setLoading(false);
    }, 600);
  };

  const PlayerSelect = ({ value, onChange, label, exclude }: { value: string, onChange: (v: string) => void, label: string, exclude: string[] }) => (
    <div className="flex flex-col w-full">
      <label className="text-xs font-bold text-gray-500 mb-1 md:mb-2 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 md:p-4 rounded-xl border border-gray-200 bg-white text-gonect-primary font-bold text-base md:text-lg focus:ring-2 focus:ring-gonect-primary focus:border-gonect-primary outline-none transition-shadow appearance-none cursor-pointer placeholder-gray-400 hover:bg-gray-50"
        >
          <option value="" className="text-gray-400">Selecteer Speler</option>
          {sortedPlayers.map(p => (
            <option key={p.id} value={p.id} disabled={exclude.includes(p.id)} className="text-gray-700">
              {p.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl md:p-8 p-5 border border-gray-100 shadow-soft relative overflow-hidden mb-24 md:mb-0">
      
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gonect-black flex items-center gap-3">
        <Trophy className="text-gonect-primary" /> Wedstrijd Invoeren
      </h2>

      <div className="flex bg-gonect-surface p-1 rounded-full mb-8 border border-gray-200">
        <button
          onClick={() => setMatchType('1v1')}
          className={`flex-1 py-3 rounded-full font-bold flex justify-center items-center gap-2 transition-all text-sm md:text-base ${matchType === '1v1' ? 'bg-white text-gonect-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <User size={18} /> 1v1
        </button>
        <button
          onClick={() => setMatchType('2v2')}
          className={`flex-1 py-3 rounded-full font-bold flex justify-center items-center gap-2 transition-all text-sm md:text-base ${matchType === '2v2' ? 'bg-white text-gonect-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Users size={18} /> 2v2
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Teams Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Team A */}
          <div className="bg-blue-50 p-4 md:p-6 rounded-3xl border border-blue-100">
            <h3 className="font-bold text-blue-600 mb-4 text-center tracking-widest text-sm uppercase">Team Blauw</h3>
            <div className="space-y-4">
              <PlayerSelect 
                label={matchType === '2v2' ? "Aanvaller" : "Speler"} 
                value={teamA1} 
                onChange={setTeamA1} 
                exclude={[teamA2, teamB1, teamB2]}
              />
              {matchType === '2v2' && (
                <PlayerSelect 
                  label="Verdediger" 
                  value={teamA2} 
                  onChange={setTeamA2} 
                  exclude={[teamA1, teamB1, teamB2]}
                />
              )}
            </div>
            <div className="mt-6">
               <label className="text-xs font-bold text-blue-400 mb-2 block uppercase text-center">Score</label>
               <input 
                type="number" 
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-full p-3 md:p-4 text-4xl text-center font-black rounded-2xl border border-blue-200 bg-white text-gonect-primary focus:border-blue-500 outline-none placeholder-gray-300"
                placeholder="0"
               />
            </div>
          </div>

          {/* Team B */}
          <div className="bg-orange-50 p-4 md:p-6 rounded-3xl border border-orange-100">
            <h3 className="font-bold text-orange-600 mb-4 text-center tracking-widest text-sm uppercase">Team Oranje</h3>
            <div className="space-y-4">
              <PlayerSelect 
                label={matchType === '2v2' ? "Aanvaller" : "Speler"} 
                value={teamB1} 
                onChange={setTeamB1} 
                exclude={[teamA1, teamA2, teamB2]}
              />
              {matchType === '2v2' && (
                <PlayerSelect 
                  label="Verdediger" 
                  value={teamB2} 
                  onChange={setTeamB2} 
                  exclude={[teamA1, teamA2, teamB1]}
                />
              )}
            </div>
             <div className="mt-6">
               <label className="text-xs font-bold text-orange-400 mb-2 block uppercase text-center">Score</label>
               <input 
                type="number" 
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-full p-3 md:p-4 text-4xl text-center font-black rounded-2xl border border-orange-200 bg-white text-gonect-primary focus:border-orange-500 outline-none placeholder-gray-300"
                placeholder="0"
               />
            </div>
          </div>

        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 md:py-5 bg-gonect-black text-white rounded-full font-bold text-lg md:text-xl hover:shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? (
            <span className="animate-pulse">Opslaan...</span>
          ) : (
            <>
              <Save size={24} /> Uitslag Opslaan
            </>
          )}
        </button>

      </form>
    </div>
  );
};

export default MatchEntry;
