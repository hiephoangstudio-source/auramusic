
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Music, ListMusic, X, Search, CheckCircle2, GripVertical, 
  Sparkles, ArrowRight, Library, Play, Check, Square, CheckSquare, 
  CopyPlus, ChevronRight
} from 'lucide-react';
import { Playlist, Song } from '../types';

interface PlaylistManagerProps {
  playlists: Playlist[];
  songs: Song[];
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddToPlaylist: (playlistId: string, songId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, songId: string) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onClose: () => void;
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  songs,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onSelectPlaylist,
  onClose
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(playlists[0]?.id || null);
  const [searchSong, setSearchSong] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // State cho việc chọn nhiều bài hát
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());

  const selectedPlaylist = useMemo(() => 
    playlists.find(p => p.id === selectedPlaylistId), 
    [playlists, selectedPlaylistId]
  );

  const filteredLibrary = useMemo(() => songs.filter(s => 
    searchSong === '' || 
    s.title.toLowerCase().includes(searchSong.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchSong.toLowerCase())
  ), [songs, searchSong]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
    }
  };

  const toggleSelectSong = (id: string) => {
    const newSet = new Set(selectedSongIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSongIds(newSet);
  };

  const selectAllFiltered = () => {
    if (selectedSongIds.size === filteredLibrary.length) {
      setSelectedSongIds(new Set());
    } else {
      setSelectedSongIds(new Set(filteredLibrary.map(s => s.id)));
    }
  };

  const addSelectedToPlaylist = () => {
    if (!selectedPlaylistId) return;
    selectedSongIds.forEach(id => {
      onAddToPlaylist(selectedPlaylistId, id);
    });
    setSelectedSongIds(new Set());
    if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
  };

  const handleDragStart = (e: React.DragEvent, songId: string) => {
    e.dataTransfer.setData('songId', songId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const songId = e.dataTransfer.getData('songId');
    if (songId && selectedPlaylistId) {
      onAddToPlaylist(selectedPlaylistId, songId);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="glass w-full max-w-7xl h-[95vh] rounded-[2rem] sm:rounded-[4rem] p-4 sm:p-10 flex flex-col relative animate-in zoom-in-95 duration-500 overflow-hidden border-white/10 shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 sm:top-10 sm:right-10 p-3 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white z-50"
        >
          <X size={24} />
        </button>

        <header className="mb-8 shrink-0 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
              <ListMusic size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic">Playlist Studio</h2>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Quản lý danh sách phát chuyên nghiệp</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* COLUMN 1: PLAYLIST SELECTION */}
          <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Danh sách phát</h3>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/20 font-bold">{playlists.length}</span>
            </div>
            
            <form onSubmit={handleCreate} className="relative shrink-0">
              <input
                type="text"
                placeholder="Tạo Playlist mới..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold placeholder:text-white/20"
              />
              <button type="submit" className="absolute right-3 top-2.5 p-1 text-indigo-400 hover:scale-110 transition-transform">
                <Plus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPlaylistId(p.id)}
                  className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                    selectedPlaylistId === p.id 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl translate-x-1' 
                      : 'hover:bg-white/5 border-transparent text-white/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{p.name}</p>
                    <p className={`text-[8px] uppercase font-black ${selectedPlaylistId === p.id ? 'text-white/60' : 'text-white/20'}`}>
                      {p.songIds.length} bài hát
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeletePlaylist(p.id); }}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: LIBRARY SOURCE (The "Pick" column) */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Library size={12} /> Thư viện Aura
              </h3>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text" placeholder="Tìm bài hát..." value={searchSong}
                  onChange={(e) => setSearchSong(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold w-32 sm:w-48"
                />
              </div>
            </div>

            {/* Bulk Actions Bar */}
            <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded-xl border border-white/5 shrink-0">
              <button 
                onClick={selectAllFiltered}
                className="text-[9px] font-black uppercase text-white/40 hover:text-white flex items-center gap-2 px-2 py-1"
              >
                {selectedSongIds.size === filteredLibrary.length ? <CheckSquare size={14} /> : <Square size={14} />}
                Chọn tất cả
              </button>
              
              {selectedSongIds.size > 0 && (
                <button 
                  onClick={addSelectedToPlaylist}
                  className="bg-indigo-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-indigo-400 transition-all animate-in zoom-in-95"
                >
                  <CopyPlus size={14} />
                  Thêm {selectedSongIds.size} bài
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {filteredLibrary.map(song => {
                const isSelected = selectedSongIds.has(song.id);
                const isAlreadyInPlaylist = selectedPlaylist?.songIds.includes(song.id);
                
                return (
                  <div 
                    key={song.id} 
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, song.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all border group cursor-grab active:cursor-grabbing ${
                      isSelected ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'
                    } ${isAlreadyInPlaylist ? 'opacity-50' : ''}`}
                    onClick={() => !isAlreadyInPlaylist && toggleSelectSong(song.id)}
                  >
                    <div className="shrink-0 text-indigo-400">
                      {isAlreadyInPlaylist ? <Check size={16} /> : (isSelected ? <CheckSquare size={16} /> : <Square size={16} className="opacity-20 group-hover:opacity-100" />)}
                    </div>
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0">
                      <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate">{song.title}</p>
                      <p className="text-[9px] text-white/30 uppercase font-black truncate">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <GripVertical size={14} className="text-white/20" />
                    </div>
                  </div>
                );
              })}
              {filteredLibrary.length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <Music size={40} className="mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest">Trống</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: PLAYLIST CONTENT (The "Result" column) */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
             <div className="flex items-center justify-between shrink-0 px-2">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} /> Bài hát trong Playlist
                </h3>
                {selectedPlaylist && selectedPlaylist.songIds.length > 0 && (
                  <button 
                    onClick={() => onSelectPlaylist(selectedPlaylist)}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Nghe ngay <Play size={10} fill="currentColor" />
                  </button>
                )}
             </div>

             <div 
               onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
               onDragLeave={() => setIsDraggingOver(false)}
               onDrop={handleDrop}
               className={`flex-1 rounded-[2.5rem] p-4 sm:p-6 transition-all flex flex-col gap-2 overflow-y-auto scrollbar-hide relative border-2 border-dashed ${
                 isDraggingOver ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.2)]' : 'border-white/5 bg-white/[0.02]'
               }`}
             >
                {selectedPlaylist ? (
                  <>
                    {selectedPlaylist.songIds.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 gap-4 pointer-events-none text-center px-10">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white flex items-center justify-center mb-2">
                           <ArrowRight size={24} className="rotate-90 lg:rotate-0" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Chọn bài hát từ thư viện để thêm vào đây</p>
                      </div>
                    ) : (
                      selectedPlaylist.songIds.map((sid, index) => {
                        const song = songs.find(s => s.id === sid);
                        if (!song) return null;
                        return (
                          <div key={sid} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 group border border-transparent hover:border-white/10 transition-all hover:bg-white/[0.07] animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 min-w-0">
                              <span className="text-[9px] font-black text-white/10 w-4">{index + 1}</span>
                              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0"><img src={song.coverUrl} className="w-full h-full object-cover" alt="" /></div>
                              <div className="min-w-0">
                                 <p className="text-[11px] font-bold truncate">{song.title}</p>
                                 <p className="text-[8px] text-white/30 uppercase font-black">{song.artist}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => onRemoveFromPlaylist(selectedPlaylist.id, sid)} 
                              className="p-2 text-white/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 gap-4">
                    <ListMusic size={40} />
                    <p className="text-xs font-black uppercase tracking-widest">Chọn một Playlist</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlaylistManager;
