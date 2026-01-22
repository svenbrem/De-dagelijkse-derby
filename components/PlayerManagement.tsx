
import React, { useState, useRef } from 'react';
import { Player } from '../types';
import { createPlayer, updatePlayerProfile, deletePlayer } from '../services/eloService';
import { UserCog, Trash2, Save, X, Plus, Edit2, Check, Camera, AlertTriangle } from 'lucide-react';

interface PlayerManagementProps {
  players: Player[];
  onUpdate: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ players, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // --- Image Handling ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Edit Logic ---
  const startEditing = (player: Player) => {
    setEditingId(player.id);
    setDeleteConfirmId(null); // Reset delete state if editing
    setEditForm({
      name: player.name,
      nickname: player.nickname || '',
      department: player.department || '',
      avatar: player.avatar
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id: string) => {
    updatePlayerProfile(id, editForm);
    setEditingId(null);
    onUpdate();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (deleteConfirmId === id) {
        // Second click: perform delete
        deletePlayer(id);
        setDeleteConfirmId(null);
        onUpdate();
    } else {
        // First click: show confirmation
        setDeleteConfirmId(id);
        // Auto reset after 3 seconds
        setTimeout(() => {
            setDeleteConfirmId(prev => prev === id ? null : prev);
        }, 3000);
    }
  };

  // --- Add Logic ---
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const player = createPlayer(newName, newDept);
    // Immediately update extra fields if provided
    updatePlayerProfile(player.id, {
        nickname: newNickname,
        avatar: newAvatar || player.avatar // Use default from create if no upload
    });

    setNewName('');
    setNewNickname('');
    setNewDept('');
    setNewAvatar('');
    setIsAdding(false);
    onUpdate();
  };

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-[fadeIn_0.3s_ease-out] pb-24">
      
      {/* Header - Solid White */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="text-gonect-primary" /> Spelersbeheer
        </h2>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`w-full md:w-auto px-6 py-3 rounded-full font-bold flex justify-center items-center gap-2 transition-all shadow-md active:scale-95 ${isAdding ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gonect-black text-white hover:bg-gray-800'}`}
        >
            {isAdding ? <><X size={18}/> Annuleren</> : <><Plus size={18}/> Nieuwe Speler</>}
        </button>
      </div>

      {/* Add Player Form - Solid White */}
      {isAdding && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 animate-[slideDown_0.2s_ease-out] relative overflow-hidden z-10">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gonect-gradient"></div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gonect-primary mb-6 flex items-center gap-2 mt-2">
                <Plus size={16} /> Speler Toevoegen
            </h3>
            
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-8">
                {/* Image Upload Area */}
                <div className="flex flex-col items-center gap-3">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-50 border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative group"
                    >
                        {newAvatar ? (
                            <img src={newAvatar} className="w-full h-full object-cover" />
                        ) : (
                            <Camera className="text-gray-400 group-hover:scale-110 transition-transform" size={24} />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Wijzig</span>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, setNewAvatar)}
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase">Profielfoto</span>
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Naam *</label>
                        <input 
                            required
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gonect-primary focus:border-gonect-primary outline-none text-gray-900 font-semibold bg-gray-50 focus:bg-white transition-colors" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Bijv. Jan Jansen"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Bijnaam</label>
                        <input 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gonect-primary focus:border-gonect-primary outline-none text-gray-900 font-semibold bg-gray-50 focus:bg-white transition-colors" 
                            value={newNickname} 
                            onChange={e => setNewNickname(e.target.value)}
                            placeholder="De Sloopkogel"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Afdeling</label>
                        <input 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gonect-primary focus:border-gonect-primary outline-none text-gray-900 font-semibold bg-gray-50 focus:bg-white transition-colors" 
                            value={newDept} 
                            onChange={e => setNewDept(e.target.value)}
                            placeholder="Bijv. Sales"
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-4">
                        <button type="submit" className="bg-gonect-primary text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition-colors shadow-lg active:scale-95 w-full md:w-auto">
                            Toevoegen
                        </button>
                    </div>
                </div>
            </form>
        </div>
      )}

      {/* Players List Container - Solid White */}
      <div className="bg-white md:rounded-3xl md:shadow-sm md:border md:border-gray-200 overflow-hidden">
        
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-3 p-4 bg-transparent">
             {sortedPlayers.map(player => (
                <div key={player.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">
                    {editingId === player.id ? (
                        <div className="flex-1 space-y-3">
                             <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 shrink-0 group/edit-img cursor-pointer" onClick={() => editFileInputRef.current?.click()}>
                                    <img src={editForm.avatar || player.avatar} className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm" />
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity">
                                        <Camera size={14} className="text-white" />
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={editFileInputRef}
                                        accept="image/*"
                                        className="hidden" 
                                        onChange={(e) => handleImageUpload(e, (val) => setEditForm({...editForm, avatar: val}))}
                                    />
                                </div>
                                <input 
                                    className="border-b-2 border-gonect-primary bg-transparent py-1 font-bold text-base w-full outline-none text-gray-900 placeholder-gray-400"
                                    value={editForm.name}
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    placeholder="Naam"
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <input 
                                    className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gonect-primary text-gray-900"
                                    value={editForm.nickname}
                                    onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                                    placeholder="Bijnaam"
                                />
                                <input 
                                    className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gonect-primary text-gray-900"
                                    value={editForm.department}
                                    onChange={e => setEditForm({...editForm, department: e.target.value})}
                                    placeholder="Afdeling"
                                />
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => saveEdit(player.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold shadow-sm">Opslaan</button>
                                <button onClick={cancelEditing} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-200">Annuleren</button>
                             </div>
                        </div>
                    ) : (
                        <>
                            <img className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm" src={player.avatar} alt="" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate text-base">{player.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{player.department || 'Geen afdeling'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => startEditing(player)} className="p-2 text-gray-400 bg-gray-50 rounded-lg hover:text-gonect-primary hover:bg-green-50 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                {deleteConfirmId === player.id ? (
                                    <button onClick={(e) => handleDeleteClick(e, player.id)} className="p-2 bg-red-500 text-white rounded-lg animate-pulse shadow-md">
                                        <AlertTriangle size={16} />
                                    </button>
                                ) : (
                                    <button onClick={(e) => handleDeleteClick(e, player.id)} className="p-2 text-gray-400 bg-gray-50 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
             ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs uppercase font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Speler</th>
                        <th className="px-6 py-4 hidden md:table-cell">Details</th>
                        <th className="px-6 py-4 text-right">Acties</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {sortedPlayers.map(player => (
                        <tr key={player.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                {editingId === player.id ? (
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 shrink-0 group/edit-img cursor-pointer" onClick={() => editFileInputRef.current?.click()}>
                                            <img src={editForm.avatar || player.avatar} className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm" />
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/edit-img:opacity-100 transition-opacity">
                                                <Camera size={16} className="text-white" />
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={editFileInputRef}
                                                accept="image/*"
                                                className="hidden" 
                                                onChange={(e) => handleImageUpload(e, (val) => setEditForm({...editForm, avatar: val}))}
                                            />
                                        </div>
                                        <input 
                                            className="border-b-2 border-gonect-primary bg-transparent py-1 font-bold text-lg w-full outline-none text-gray-900"
                                            value={editForm.name}
                                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                                            placeholder="Naam"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <div className="relative">
                                            <img className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-300" src={player.avatar} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-base font-bold text-gray-900">{player.name}</div>
                                            {player.nickname && <div className="text-xs text-gonect-primary italic font-medium">{player.nickname}</div>}
                                        </div>
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell align-middle">
                                {editingId === player.id ? (
                                    <div className="flex flex-col gap-2">
                                        <input 
                                            className="bg-gray-50 border border-gray-300 rounded px-3 py-1 text-xs w-full outline-none focus:border-gonect-primary text-gray-900 font-medium"
                                            value={editForm.nickname}
                                            onChange={e => setEditForm({...editForm, nickname: e.target.value})}
                                            placeholder="Bijnaam"
                                        />
                                        <input 
                                            className="bg-gray-50 border border-gray-300 rounded px-3 py-1 text-xs w-full outline-none focus:border-gonect-primary text-gray-900 font-medium"
                                            value={editForm.department}
                                            onChange={e => setEditForm({...editForm, department: e.target.value})}
                                            placeholder="Afdeling"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        <span className="block font-medium text-gray-700">{player.department || '-'}</span>
                                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 mt-1 inline-block border border-gray-200">Elo: {player.rating}</span>
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap align-middle">
                                {editingId === player.id ? (
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => saveEdit(player.id)} className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md transition-transform active:scale-95" title="Opslaan">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={cancelEditing} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-transform active:scale-95" title="Annuleren">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-2 relative z-10">
                                        <button onClick={() => startEditing(player)} className="p-2 text-gray-400 hover:text-gonect-primary hover:bg-green-50 rounded-xl transition-all cursor-pointer" title="Bewerken">
                                            <Edit2 size={18} />
                                        </button>
                                        
                                        {deleteConfirmId === player.id ? (
                                            <button 
                                                onClick={(e) => handleDeleteClick(e, player.id)} 
                                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold shadow-md animate-pulse hover:bg-red-600 transition-colors flex items-center gap-1"
                                                title="Klik nogmaals om definitief te verwijderen"
                                            >
                                                <AlertTriangle size={14} /> Zeker?
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => handleDeleteClick(e, player.id)} 
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer" 
                                                title="Verwijderen"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;
