
import React, { useState } from 'react';
import { Plus, Trash2, Music, ListMusic, X, Search, CheckCircle2 } from 'lucide-react';
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

  const selectedPlaylist = playlists.find(p => p.id === selectedId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
    }
  };

  const filteredSongsToAdd = songs.filter(s => 
    !selectedPlaylist?.songIds.includes(s.id) && 
    (s.title.toLowerCase().includes(searchSong.toLowerCase()) || s.artist.toLowerCase().includes(searchSong.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass w-full max-w-4xl h-[85vh] rounded-[3rem] p-8 lg:p-12 flex flex-col relative animate-in zoom-in-95 duration-500 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
        >
          <X size={24} />
        </button>

        <header className="mb-10">
          <h2 className="text-2xl font-black font-syncopate flex items-center gap-4 tracking-tighter">
            <ListMusic size={32} className="text-indigo-500" />
            MY PLAYLISTS
          </h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mt-2">Manage your sound collection</p>
        </header>

        <div className="flex gap-10 flex-1 min-h-0">
          {/* Left: Playlists List */}
          <div className="w-1/3 border-r border-white/5 pr-8 space-y-6 overflow-y-auto scrollbar-hide">
            <form onSubmit={handleCreate} className="relative group">
              <input
                type="text"
                placeholder="Tên danh sách mới..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20"
              />
              <button type="submit" className="absolute right-3 top-2.5 p-1 text-indigo-400 hover:scale-110 transition-transform">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-2">
              {playlists.length === 0 && (
                <p className="text-[10px] text-white/20 font-bold uppercase text-center py-10">Chưa có playlist nào</p>
              )}
              {playlists.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedId === p.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'hover:bg-white/5 text-white/60'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black truncate">{p.name}</p>
                    <p className={`text-[9px] uppercase tracking-widest font-bold ${selectedId === p.id ? 'text-white/60' : 'text-white/20'}`}>
                      {p.songIds.length} bài hát
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

          {/* Right: Songs in Playlist & Add Songs */}
          <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            {selectedPlaylist ? (
              <>
                <div className="flex items-center justify-between sticky top-0 bg-transparent z-10 py-2">
                  <h3 className="text-2xl font-black tracking-tight">{selectedPlaylist.name}</h3>
                  <button 
                    disabled={selectedPlaylist.songIds.length === 0}
                    onClick={() => onSelectPlaylist(selectedPlaylist)}
                    className="px-6 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                  >
                    Phát ngay
                  </button>
                </div>
                
                <section>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Bài hát hiện có</p>
                  {selectedPlaylist.songIds.length === 0 && (
                    <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-20">
                      <Music size={32} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Playlist trống</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selectedPlaylist.songIds.map(sid => {
                      const song = songs.find(s => s.id === sid);
                      if (!song) return null;
                      return (
                        <div key={sid} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 group border border-transparent hover:border-white/10 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                               <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-bold truncate">{song.title}</p>
                               <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{song.artist}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => onRemoveFromPlaylist(selectedPlaylist.id, sid)}
                            className="p-2 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Thêm từ thư viện</p>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input 
                        type="text" 
                        placeholder="Tìm bài hát..."
                        value={searchSong}
                        onChange={(e) => setSearchSong(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredSongsToAdd.length === 0 && (
                      <p className="text-[10px] text-white/20 font-bold uppercase text-center py-4">Hết nhạc để thêm</p>
                    )}
                    {filteredSongsToAdd.map(song => (
                      <div key={song.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5">
                              <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="min-w-0">
                             <p className="text-xs font-bold truncate">{song.title}</p>
                             <p className="text-[9px] text-white/20 uppercase tracking-widest">{song.artist}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => onAddToPlaylist(selectedPlaylist.id, song.id)}
                          className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-xl transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/10 space-y-4">
                <div className="p-10 border-2 border-dashed border-white/5 rounded-[3rem]">
                   <ListMusic size={64} strokeWidth={1} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Chọn hoặc tạo playlist mới</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistManager;
