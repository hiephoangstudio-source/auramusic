
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Search, Waves, List, RefreshCw, Upload, Trash2, Globe, ExternalLink, Sparkles, X, Loader2, AlertCircle, Key, Music2, Download, Copy, Check, Info, FileJson, Share, PlusCircle, HelpCircle, FolderHeart, ChevronLeft, Settings2, MoreVertical
} from 'lucide-react';
import { MOCK_PLAYLIST } from './constants';
import { Song, PlayerState, Playlist } from './types';
import Visualizer from './components/Visualizer';
import AIDJ from './components/AIDJ';
import Lyrics from './components/Lyrics';
import PlaylistManager from './components/PlaylistManager';
import { getSongInsight, getSongStory, searchMusicOnline, OnlineSongResult } from './services/geminiService';
import { saveSongBlob, getSongBlob, deleteSongBlob, saveLibraryMetadata, getLibraryMetadata, isLibraryInitialized, markLibraryInitialized } from './services/dbService';

const App: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('aura_player_state');
    if (saved) return { ...JSON.parse(saved), isPlaying: false, currentTime: 0 };
    return {
      isPlaying: false, currentSongIndex: 0, currentTime: 0, volume: 0.7,
      isShuffle: false, repeatMode: 'none', visualizerType: 'bars', theme: 'dark', viewMode: 'player'
    } as any;
  });

  const [library, setLibrary] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('aura_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Điều hướng Thư viện
  const [viewingPlaylistId, setViewingPlaylistId] = useState<string | null>(null); // null = list of playlists, 'all' = all songs, id = specific playlist
  const [activeQueueIds, setActiveQueueIds] = useState<string[]>([]);
  
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'lyrics' | 'story'>('ai');
  const [showLibrary, setShowLibrary] = useState(true);
  const [showPlaylistStudio, setShowPlaylistStudio] = useState(false);
  const [songStory, setSongStory] = useState<string | null>(null);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('aura_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    const loadLibrary = async () => {
      setIsLibraryLoading(true);
      try {
        const initialized = await isLibraryInitialized();
        const metadata = await getLibraryMetadata();
        
        let loadedSongs: Song[] = [];
        if (!initialized) {
          loadedSongs = MOCK_PLAYLIST;
          await saveLibraryMetadata(MOCK_PLAYLIST);
          await markLibraryInitialized();
        } else {
          for (const song of metadata) {
            if (song.id.startsWith('user')) {
              const blob = await getSongBlob(song.id);
              if (blob) {
                loadedSongs.push({ ...song, audioUrl: URL.createObjectURL(blob) });
              }
            } else {
              loadedSongs.push(song);
            }
          }
        }
        setLibrary(loadedSongs);
        setActiveQueueIds(loadedSongs.map(s => s.id));
      } catch (err) {
        setLibrary(MOCK_PLAYLIST);
      }
      setIsLibraryLoading(false);
    };
    loadLibrary();
  }, []);

  // Xác định bài hát hiện tại dựa trên hàng đợi
  const currentQueueSongs = useMemo(() => {
    return activeQueueIds.map(id => library.find(s => s.id === id)).filter(Boolean) as Song[];
  }, [activeQueueIds, library]);

  const currentSong = useMemo(() => {
    if (currentQueueSongs.length === 0) return null;
    return currentQueueSongs[playerState.currentSongIndex] || currentQueueSongs[0];
  }, [playerState.currentSongIndex, currentQueueSongs]);

  // Playlist Handlers
  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = { id: `pl-${Date.now()}`, name, songIds: [] };
    setPlaylists([...playlists, newPlaylist]);
  };

  const handleAddToPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId && !pl.songIds.includes(songId)) {
        return { ...pl, songIds: [...pl.songIds, songId] };
      }
      return pl;
    }));
  };

  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songIds: pl.songIds.filter(id => id !== songId) };
      }
      return pl;
    }));
  };

  const handleReorderPlaylist = (playlistId: string, newSongIds: string[]) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songIds: newSongIds };
      }
      return pl;
    }));
    // Nếu đang nghe chính playlist này, cập nhật hàng đợi luôn
    if (viewingPlaylistId === playlistId) {
      setActiveQueueIds(newSongIds);
    }
  };

  const startPlayingQueue = (ids: string[], startIndex: number) => {
    setActiveQueueIds(ids);
    setPlayerState(s => ({ ...s, currentSongIndex: startIndex, isPlaying: true, currentTime: 0 }));
    if (window.innerWidth < 768) setShowLibrary(false);
  };

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current && audioRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      try {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(node);
        node.connect(ctx.destination);
        audioCtxRef.current = ctx;
        setAnalyser(node);
      } catch (err) { console.error(err); }
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
  }, []);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    audioRef.current.volume = playerState.volume;
    if (playerState.isPlaying) {
      initAudioContext();
      audioRef.current.play().catch(() => setPlayerState(s => ({ ...s, isPlaying: false })));
    } else {
      audioRef.current.pause();
    }
  }, [playerState.isPlaying, currentSong?.audioUrl, initAudioContext]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newSongs: Song[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `user-${Date.now()}-${i}`;
      await saveSongBlob(id, file);
      newSongs.push({
        id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Ngoại tuyến",
        album: "Thiết bị",
        coverUrl: `https://picsum.photos/seed/${id}/400/400`,
        audioUrl: URL.createObjectURL(file),
        duration: 0,
        color: "#a855f7"
      });
    }
    const nextLib = [...library, ...newSongs];
    setLibrary(nextLib);
    await saveLibraryMetadata(nextLib);
    setIsUploading(false);
  };

  // Render nội dung Sidebar
  const renderSidebarContent = () => {
    if (viewingPlaylistId === null) {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 pb-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Thư viện của bạn</h2>
            <div 
              onClick={() => setViewingPlaylistId('all')}
              className="group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 bg-white/5 border border-white/5 hover:border-white/10 mb-6"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"><Music2 className="text-white" size={24} /></div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest">Tất cả bài hát</p>
                <p className="text-[9px] text-white/40 font-bold uppercase">{library.length} bài</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Danh sách phát</h2>
              <button onClick={() => setShowPlaylistStudio(true)} className="p-1 hover:text-indigo-400 transition-colors"><PlusCircle size={16} /></button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 scrollbar-hide">
            {playlists.map(pl => (
              <div 
                key={pl.id}
                onClick={() => setViewingPlaylistId(pl.id)}
                className="group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 hover:bg-white/5 border border-transparent hover:border-white/5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all border border-white/5">
                  <FolderHeart className="text-white/20 group-hover:text-indigo-400" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate uppercase tracking-tighter">{pl.name}</p>
                  <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">{pl.songIds.length} bài hát</p>
                </div>
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="py-10 text-center opacity-20">
                <p className="text-[9px] font-black uppercase tracking-widest italic">Chưa có playlist</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // View specific playlist or all songs
    const isAll = viewingPlaylistId === 'all';
    const targetPlaylist = !isAll ? playlists.find(p => p.id === viewingPlaylistId) : null;
    const songListIds = isAll ? library.map(s => s.id) : (targetPlaylist?.songIds || []);
    const displaySongs = songListIds.map(id => library.find(s => s.id === id)).filter(Boolean) as Song[];

    return (
      <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-300">
        <div className="p-6 flex flex-col gap-4">
          <button onClick={() => setViewingPlaylistId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">
            <ChevronLeft size={14} /> Quay lại
          </button>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black truncate uppercase tracking-tighter italic">{isAll ? "Tất cả bài hát" : targetPlaylist?.name}</h2>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">{displaySongs.length} bài hát trong danh sách</p>
            </div>
            {!isAll && (
              <button onClick={() => setShowPlaylistStudio(true)} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all">
                <Settings2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-10 space-y-1 scrollbar-hide">
          {displaySongs.map((song, idx) => (
            <div 
              key={song.id} 
              onClick={() => startPlayingQueue(songListIds, idx)}
              className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${currentSong?.id === song.id && activeQueueIds.length === songListIds.length ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'}`}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative border border-white/5">
                <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                {currentSong?.id === song.id && playerState.isPlaying && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Waves size={16} className="text-indigo-400 animate-pulse" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-black truncate ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                <p className="text-[9px] text-white/30 truncate uppercase font-bold tracking-wider">{song.artist}</p>
              </div>
            </div>
          ))}
          {displaySongs.length === 0 && (
            <div className="py-20 text-center opacity-20">
              <Music2 size={40} className="mx-auto mb-4" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">Danh sách trống</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${playerState.theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'} font-sans select-none overflow-hidden relative pb-safe`}>
      {currentSong && (
        <audio 
          ref={audioRef} src={currentSong.audioUrl} crossOrigin="anonymous"
          onTimeUpdate={() => audioRef.current && setPlayerState(s => ({ ...s, currentTime: audioRef.current!.currentTime }))}
          onEnded={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % currentQueueSongs.length }))}
        />
      )}

      {showPlaylistStudio && (
        <PlaylistManager 
          playlists={playlists}
          songs={library}
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={(id) => {
            setPlaylists(playlists.filter(p => p.id !== id));
            if (viewingPlaylistId === id) setViewingPlaylistId(null);
          }}
          onAddToPlaylist={handleAddToPlaylist}
          onRemoveFromPlaylist={handleRemoveFromPlaylist}
          onReorderPlaylist={handleReorderPlaylist}
          onSelectPlaylist={(pl) => {
            setViewingPlaylistId(pl.id);
            startPlayingQueue(pl.songIds, 0);
            setShowPlaylistStudio(false);
          }}
          onClose={() => setShowPlaylistStudio(false)}
        />
      )}

      {showHelpModal && (
        <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="glass max-w-lg w-full p-10 rounded-[4rem] border-indigo-500/20 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 mb-6"><HelpCircle size={32} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4">Hướng dẫn Aura</h3>
              <div className="space-y-4 text-left mb-10">
                 <div className="p-4 bg-white/5 rounded-2xl flex gap-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg h-fit"><Music2 size={16} className="text-indigo-400" /></div>
                    <p className="text-[10px] text-white/60 font-medium leading-relaxed uppercase tracking-wider">Chọn Playlist trong Thư viện để xem danh sách nhạc riêng của nó. Bạn có thể kéo sắp xếp lại thứ tự bài hát trong Playlist Studio.</p>
                 </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="px-10 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Đã hiểu</button>
           </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 z-[120] bg-black/80 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Aura đang đồng bộ nhạc...</p>
          </div>
        </div>
      )}

      <header className="p-4 flex items-center justify-between z-30 bg-opacity-80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg"><Music2 size={18} className="text-white" /></div>
            <h1 className="text-lg font-black tracking-tighter">AURA</h1>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className={`p-2 rounded-xl transition-all ${showLibrary ? 'bg-indigo-500/10 text-indigo-400' : 'text-white/40 hover:bg-white/5'}`}><List size={18} /></button>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowHelpModal(true)} className="p-2 text-white/20 hover:text-white"><HelpCircle size={20} /></button>
           <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"><PlusCircle size={20} /></button>
           <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Re-imagined */}
        <aside className={`glass border-r border-white/5 transition-all duration-500 flex flex-col ${showLibrary ? 'w-full sm:w-80 opacity-100 absolute sm:relative z-40 h-full' : 'w-0 opacity-0 overflow-hidden'}`}>
          {renderSidebarContent()}
        </aside>

        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-y-auto sm:overflow-hidden scrollbar-hide">
          <div className="flex-1 glass rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 flex flex-col relative overflow-hidden min-h-[500px]">
             {currentSong ? (
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 mb-1 block">Aura Playing</span>
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-0.5 truncate uppercase italic">{currentSong.title}</h2>
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest truncate">{currentSong.artist}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-10">
                    <div className="w-48 h-48 sm:w-72 sm:h-72 rounded-[4rem] overflow-hidden shadow-2xl relative z-10 group">
                      <img src={currentSong.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay"></div>
                    </div>
                    <div className="w-full max-w-xl mt-12 hidden sm:block">
                       <Visualizer analyser={analyser} color={currentSong.color} type="bars" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-8 sm:gap-12 mt-auto pt-6">
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex - 1 + currentQueueSongs.length) % currentQueueSongs.length }))} className="text-white/20 hover:text-white transition-colors"><SkipBack size={32} fill="currentColor" /></button>
                    <button onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))} className="w-20 h-20 rounded-[2.5rem] bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20">
                      {playerState.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % currentQueueSongs.length }))} className="text-white/20 hover:text-white transition-colors"><SkipForward size={32} fill="currentColor" /></button>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-20 text-center py-20">
                 <div className="p-10 rounded-full border border-white/5 bg-white/5 mb-6"><Music2 size={80} strokeWidth={1} /></div>
                 <h2 className="text-xl font-black uppercase tracking-[0.4em] italic">Aura Assistant</h2>
                 <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2">Chọn nhạc từ Thư viện để bắt đầu</p>
               </div>
             )}
          </div>

          <div className="w-full lg:w-[400px] flex flex-col gap-6">
            <div className="glass rounded-2xl p-1.5 flex bg-white/5 shrink-0">
               {(['ai', 'lyrics', 'story'] as const).map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-white/40 hover:text-white/60'}`}>
                   {tab === 'ai' ? 'Trợ lý' : tab === 'lyrics' ? 'Lời bài hát' : 'Câu chuyện'}
                 </button>
               ))}
            </div>
            <div className="flex-1 min-h-[400px]">
               {activeTab === 'ai' && <AIDJ onPlaySong={(title, artist) => {}} availableSongs={library} />}
               {activeTab === 'lyrics' && <div className="glass rounded-[3rem] h-full p-8"><Lyrics lyrics={currentSong?.lyrics || []} currentTime={playerState.currentTime} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} color={currentSong?.color || '#fff'} /></div>}
               {activeTab === 'story' && (
                 <div className="glass rounded-[3rem] h-full p-10 overflow-y-auto scrollbar-hide flex flex-col">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-3"><Sparkles className="text-indigo-400" size={20} /> Deep Insights</h3>
                    {isStoryLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20"><RefreshCw className="animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest">Đang phân tích...</span></div>
                    ) : (
                      <div className="space-y-6"><p className="text-base font-medium leading-relaxed italic text-white/80">"{songStory || 'Aura đang cảm nhận âm điệu của bạn...'}"</p></div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
