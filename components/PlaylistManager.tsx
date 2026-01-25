import React, { useState } from 'react';
import { Plus, Trash2, Music, ListMusic, X, Search, CheckCircle2, GripVertical, Sparkles, ChevronRight, ArrowRight, Library, Play } from 'lucide-react';
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
  const [selectedId, setSelectedId] = useState<string | null>(playlists[0]?.id || null);
  const [searchSong, setSearchSong] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const selectedPlaylist = playlists.find(p => p.id === selectedId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
    }
  };

  const handleDragStart = (e: React.DragEvent, songId: string) => {
    e.dataTransfer.setData('songId', songId);
    e.dataTransfer.effectAllowed = 'copy';
    // Visual feedback for drag start
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const songId = e.dataTransfer.getData('songId');
    if (songId && selectedId) {
      onAddToPlaylist(selectedId, songId);
    }
  };

  const filteredLibrary = songs.filter(s => 
    searchSong === '' || 
    s.title.toLowerCase().includes(searchSong.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchSong.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="glass w-full max-w-7xl h-[95vh] rounded-[2rem] sm:rounded-[4rem] p-4 sm:p-10 flex flex-col relative animate-in zoom-in-95 duration-500 overflow-hidden border-white/10 shadow-2xl">
        
        {/* Nút Đóng */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 sm:top-10 sm:right-10 p-3 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white z-50"
        >
          <X size={24} />
        </button>

        <header className="mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
              <ListMusic size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic">Playlist Studio</h2>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Thiết kế không gian âm nhạc của riêng bạn</p>
            </div>
          </div>
        </header>

        {/* Layout 3 Cột chính */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* Cột 1: Danh sách Playlist */}
          <div className="w-full lg:w-72 flex flex-col gap-4 overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-6">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
              <ListMusic size={12} /> Playlists
            </h3>
            
            <form onSubmit={handleCreate} className="relative shrink-0">
              <input
                type="text"
                placeholder="Tên mới..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
              />
              <button type="submit" className="absolute right-3 top-2.5 p-1 text-indigo-400">
                <Plus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                    selectedId === p.id 
                      ? 'bg-indigo-500 border-indigo-400 text-white shadow-xl translate-x-1' 
                      : 'hover:bg-white/5 border-transparent text-white/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{p.name}</p>
                    <p className={`text-[8px] uppercase font-black ${selectedId === p.id ? 'text-white/60' : 'text-white/20'}`}>
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

          {/* Cột 2: Thư viện Nhạc (Nguồn kéo) */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-6 lg:pl-2">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                <Library size={12} /> Thư viện Aura
              </h3>
              <div className="relative w-40">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text" placeholder="Tìm kiếm..." value={searchSong}
                  onChange={(e) => setSearchSong(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2 scrollbar-hide">
              {filteredLibrary.map(song => (
                <div 
                  key={song.id} 
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, song.id)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all cursor-grab active:cursor-grabbing group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shrink-0">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black truncate">{song.title}</p>
                    <p className="text-[9px] text-white/30 uppercase font-black truncate">{song.artist}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => selectedId && onAddToPlaylist(selectedId, song.id)}
                      className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"
                    >
                      <Plus size={14} />
                    </button>
                    <GripVertical size={14} className="text-white/20" />
                  </div>
                </div>
              ))}
              {filteredLibrary.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20">
                  <Music size={40} className="mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest">Không tìm thấy nhạc</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột 3: Nội dung Playlist (Khu vực thả) */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden lg:pl-2">
             <div className="flex items-center justify-between shrink-0">
                <h3 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} /> Nội dung Playlist
                </h3>
                {selectedPlaylist && (
                  <button 
                    disabled={selectedPlaylist.songIds.length === 0}
                    onClick={() => onSelectPlaylist(selectedPlaylist)}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Nghe ngay {/* Fixed missing Play icon import */} <Play size={10} fill="currentColor" />
                  </button>
                )}
             </div>

             <div 
               onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
               onDragLeave={() => setIsDraggingOver(false)}
               onDrop={handleDrop}
               className={`flex-1 rounded-[2.5rem] p-4 sm:p-6 transition-all flex flex-col gap-3 overflow-y-auto scrollbar-hide relative border-2 border-dashed ${
                 isDraggingOver ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.2)]' : 'border-white/5 bg-white/[0.02]'
               }`}
             >
                {selectedPlaylist ? (
                  <>
                    {selectedPlaylist.songIds.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 gap-4 pointer-events-none">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                           <ArrowRight size={32} className="rotate-90 lg:rotate-0" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-center px-10">Kéo nhạc từ thư viện thả vào đây</p>
                      </div>
                    ) : (
                      selectedPlaylist.songIds.map(sid => {
                        const song = songs.find(s => s.id === sid);
                        if (!song) return null;
                        return (
                          <div key={sid} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 group border border-transparent hover:border-white/10 transition-all hover:bg-white/[0.07] animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg"><img src={song.coverUrl} className="w-full h-full object-cover" alt="" /></div>
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
                    <p className="text-xs font-black uppercase tracking-widest">Chọn playlist để xem nội dung</p>
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