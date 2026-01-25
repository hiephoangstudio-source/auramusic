
import React, { useState } from 'react';
import { Plus, Trash2, Music, ListMusic, X, Search, CheckCircle2, GripVertical, Sparkles } from 'lucide-react';
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const songId = e.dataTransfer.getData('songId');
    if (songId && selectedId) {
      onAddToPlaylist(selectedId, songId);
    }
  };

  const filteredSongsToAdd = songs.filter(s => 
    !selectedPlaylist?.songIds.includes(s.id) && 
    (s.title.toLowerCase().includes(searchSong.toLowerCase()) || s.artist.toLowerCase().includes(searchSong.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="glass w-full max-w-5xl h-[90vh] rounded-[4rem] p-8 lg:p-14 flex flex-col relative animate-in zoom-in-95 duration-500 overflow-hidden border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.1)]">
        
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 p-4 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
        >
          <X size={28} />
        </button>

        <header className="mb-12">
          <h2 className="text-3xl font-black flex items-center gap-4 tracking-tighter">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <ListMusic size={32} className="text-white" />
            </div>
            PLAYLIST STUDIO
          </h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-3">Design your personal soundscape</p>
        </header>

        <div className="flex gap-12 flex-1 min-h-0">
          {/* Cột Trái: Danh sách Playlist */}
          <div className="w-80 border-r border-white/5 pr-8 flex flex-col gap-8 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleCreate} className="relative group shrink-0">
              <input
                type="text"
                placeholder="Tên danh sách mới..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20 font-bold"
              />
              <button type="submit" className="absolute right-4 top-3.5 p-1 text-indigo-400 hover:scale-125 transition-transform">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3">
              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-500/20'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('bg-indigo-500/20')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('bg-indigo-500/20');
                    const songId = e.dataTransfer.getData('songId');
                    if (songId) onAddToPlaylist(p.id, songId);
                  }}
                  className={`group flex items-center justify-between p-5 rounded-3xl cursor-pointer transition-all border ${
                    selectedId === p.id 
                      ? 'bg-indigo-500 border-indigo-400 text-white shadow-2xl shadow-indigo-500/30 scale-[1.02]' 
                      : 'hover:bg-white/5 border-transparent text-white/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black truncate">{p.name}</p>
                    <p className={`text-[9px] uppercase tracking-widest font-black ${selectedId === p.id ? 'text-white/60' : 'text-white/20'}`}>
                      {p.songIds.length} tracks
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeletePlaylist(p.id); }}
                    className={`p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${selectedId === p.id ? 'hover:bg-white/20' : 'hover:bg-red-500/20 hover:text-red-400'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cột Phải: Nội dung Playlist & Thư viện (Drop Zone) */}
          <div className="flex-1 flex flex-col gap-10 min-h-0">
            {selectedPlaylist ? (
              <>
                <div 
                  className={`flex-1 border-2 border-dashed rounded-[3rem] p-8 transition-all flex flex-col gap-6 overflow-y-auto scrollbar-hide relative ${
                    isDraggingOver ? 'bg-indigo-500/10 border-indigo-500 scale-[0.99] shadow-inner' : 'border-white/5 bg-white/2'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{selectedPlaylist.name}</h3>
                      <p className="text-[10px] font-black uppercase text-indigo-400/60 tracking-widest">Thả nhạc vào đây để thêm</p>
                    </div>
                    <button 
                      disabled={selectedPlaylist.songIds.length === 0}
                      onClick={() => onSelectPlaylist(selectedPlaylist)}
                      className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      Play List
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedPlaylist.songIds.map(sid => {
                      const song = songs.find(s => s.id === sid);
                      if (!song) return null;
                      return (
                        <div key={sid} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 group border border-transparent hover:border-white/10 transition-all hover:bg-white/[0.07]">
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg"><img src={song.coverUrl} className="w-full h-full object-cover" alt="" /></div>
                            <div className="min-w-0">
                               <p className="text-xs font-bold truncate">{song.title}</p>
                               <p className="text-[9px] text-white/30 uppercase font-black">{song.artist}</p>
                            </div>
                          </div>
                          <button onClick={() => onRemoveFromPlaylist(selectedPlaylist.id, sid)} className="p-2 text-white/10 hover:text-red-400 transition-all sm:opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                    {selectedPlaylist.songIds.length === 0 && (
                       <div className="py-20 flex flex-col items-center justify-center opacity-10 gap-4">
                          <Sparkles size={60} />
                          <p className="text-xs font-black uppercase tracking-widest">Kéo nhạc từ bên dưới vào đây</p>
                       </div>
                    )}
                  </div>
                </div>

                <div className="h-1/3 flex flex-col gap-6 shrink-0 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Thư viện Aura (Kéo lên trên)</p>
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <input 
                        type="text" placeholder="Tìm nhạc..." value={searchSong}
                        onChange={(e) => setSearchSong(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                    {filteredSongsToAdd.map(song => (
                      <div 
                        key={song.id} 
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, song.id)}
                        className="flex-none w-48 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/40 transition-all cursor-grab active:cursor-grabbing group hover:bg-white/[0.08]"
                      >
                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 shadow-xl group-hover:scale-105 transition-transform duration-500">
                          <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <p className="text-xs font-bold truncate mb-1">{song.title}</p>
                        <p className="text-[9px] text-white/20 uppercase font-black truncate">{song.artist}</p>
                        <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <GripVertical size={14} className="text-indigo-400" />
                           <Plus size={14} onClick={() => onAddToPlaylist(selectedPlaylist.id, song.id)} className="cursor-pointer hover:text-indigo-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20 gap-6">
                <div className="p-16 border-2 border-dashed border-white/10 rounded-[5rem]"><ListMusic size={80} strokeWidth={1} /></div>
                <p className="text-xs font-black uppercase tracking-[0.5em]">Hãy chọn hoặc tạo Playlist mới</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistManager;
