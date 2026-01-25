
import React, { useState } from 'react';
import { Plus, Trash2, Music, ListMusic, X } from 'lucide-react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPlaylist = playlists.find(p => p.id === selectedId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-2xl h-[80vh] rounded-[2.5rem] p-8 flex flex-col relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-8 font-syncopate flex items-center gap-3">
          <ListMusic size={32} className="text-indigo-500" />
          DANH SÁCH PHÁT
        </h2>

        <div className="flex gap-8 flex-1 min-h-0">
          {/* List of Playlists */}
          <div className="w-1/3 border-r border-white/10 pr-6 space-y-4 overflow-y-auto">
            <form onSubmit={handleCreate} className="relative mb-6">
              <input
                type="text"
                placeholder="Tạo danh sách mới..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button type="submit" className="absolute right-2 top-1.5 text-indigo-400">
                <Plus size={20} />
              </button>
            </form>

            {playlists.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  selectedId === p.id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5'
                }`}
              >
                <span className="font-medium truncate">{p.name}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeletePlaylist(p.id); }}
                    className="p-1 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Playlist Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {selectedPlaylist ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{selectedPlaylist.name}</h3>
                  <button 
                    onClick={() => onSelectPlaylist(selectedPlaylist)}
                    className="px-4 py-1.5 bg-indigo-500 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                  >
                    Phát danh sách này
                  </button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Bài hát trong danh sách</p>
                  {selectedPlaylist.songIds.length === 0 && (
                    <p className="text-sm text-white/20 italic">Chưa có bài hát nào.</p>
                  )}
                  {selectedPlaylist.songIds.map(sid => {
                    const song = songs.find(s => s.id === sid);
                    if (!song) return null;
                    return (
                      <div key={sid} className="flex items-center justify-between p-2 rounded-lg bg-white/5 group">
                        <div className="flex items-center gap-3">
                          <Music size={14} className="text-indigo-400" />
                          <span className="text-sm">{song.title}</span>
                        </div>
                        <button 
                          onClick={() => onRemoveFromPlaylist(selectedPlaylist.id, sid)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Thêm bài hát mới</p>
                  <div className="grid grid-cols-1 gap-2">
                    {songs.filter(s => !selectedPlaylist.songIds.includes(s.id)).map(song => (
                      <div key={song.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="text-xs">{song.title}</span>
                        <button 
                          onClick={() => onAddToPlaylist(selectedPlaylist.id, song.id)}
                          className="p-1 text-indigo-400 hover:text-white"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Music size={48} strokeWidth={1} className="mb-4" />
                <p>Chọn một danh sách phát để quản lý</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistManager;
