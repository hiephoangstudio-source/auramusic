
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Search, Waves, List, RefreshCw, Upload, Trash2, Globe, ExternalLink, Sparkles, X, Loader2, AlertCircle, Key, Music2, Download, Copy, Check, Info, FileJson, Share, PlusCircle, HelpCircle, FolderHeart, ChevronLeft, Settings2, MoreVertical, ArrowUpDown, SortAsc, SortDesc, Gauge, Compass
} from 'lucide-react';
import { MOCK_PLAYLIST, MOCK_CHARTS } from './constants';
import { Song, PlayerState, Playlist, ViewMode } from './types';
import Visualizer from './components/Visualizer';
import AIDJ from './components/AIDJ';
import Charts from './components/Charts';
import PlaylistManager from './components/PlaylistManager';
import { saveSongBlob, getSongBlob, saveLibraryMetadata, getLibraryMetadata, isLibraryInitialized, markLibraryInitialized } from './services/dbService';

const App: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('aura_player_state');
    if (saved) return { ...JSON.parse(saved), isPlaying: false, currentTime: 0 };
    return {
      isPlaying: false, currentSongIndex: 0, currentTime: 0, volume: 0.7,
      isShuffle: false, repeatMode: 'none', visualizerType: 'bars', theme: 'dark', viewMode: 'player',
      playbackSpeed: 1
    } as any;
  });

  const [library, setLibrary] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('aura_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [viewingPlaylistId, setViewingPlaylistId] = useState<string | null>(null);
  const [activeQueueIds, setActiveQueueIds] = useState<string[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPlaylistStudio, setShowPlaylistStudio] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  
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
              if (blob) loadedSongs.push({ ...song, audioUrl: URL.createObjectURL(blob) });
            } else loadedSongs.push(song);
          }
        }
        setLibrary(loadedSongs);
        setActiveQueueIds(loadedSongs.map(s => s.id));
      } catch (err) { setLibrary(MOCK_PLAYLIST); }
      setIsLibraryLoading(false);
    };
    loadLibrary();
  }, []);

  const currentQueueSongs = useMemo(() => activeQueueIds.map(id => {
    const song = library.find(s => s.id === id);
    if (song) return song;
    for(const cat of MOCK_CHARTS) {
      const found = cat.songs.find(s => s.id === id);
      if (found) return found;
    }
    return null;
  }).filter(Boolean) as Song[], [activeQueueIds, library]);

  const currentSong = useMemo(() => currentQueueSongs.length === 0 ? null : currentQueueSongs[playerState.currentSongIndex] || currentQueueSongs[0], [playerState.currentSongIndex, currentQueueSongs]);

  const handleCreatePlaylist = (name: string) => setPlaylists([...playlists, { id: `pl-${Date.now()}`, name, songIds: [] }]);
  const handleAddToPlaylist = (playlistId: string, songId: string) => setPlaylists(prev => prev.map(pl => (pl.id === playlistId && !pl.songIds.includes(songId)) ? { ...pl, songIds: [...pl.songIds, songId] } : pl));
  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, songIds: pl.songIds.filter(id => id !== songId) } : pl));
  const handleReorderPlaylist = (playlistId: string, newSongIds: string[]) => {
    setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, songIds: newSongIds } : pl));
    if (viewingPlaylistId === playlistId) setActiveQueueIds(newSongIds);
  };

  const startPlayingQueue = (ids: string[], startIndex: number) => {
    setActiveQueueIds(ids);
    setPlayerState(s => ({ ...s, currentSongIndex: startIndex, isPlaying: true, currentTime: 0, viewMode: 'player' }));
    if (window.innerWidth < 1024) setShowLibrary(false);
  };

  const handlePlayChartSong = (song: Song) => {
    const existingIndex = activeQueueIds.indexOf(song.id);
    if (existingIndex !== -1) {
      setPlayerState(s => ({ ...s, currentSongIndex: existingIndex, isPlaying: true, currentTime: 0, viewMode: 'player' }));
    } else {
      const newQueue = [song.id, ...activeQueueIds];
      setActiveQueueIds(newQueue);
      setPlayerState(s => ({ ...s, currentSongIndex: 0, isPlaying: true, currentTime: 0, viewMode: 'player' }));
    }
    if (window.innerWidth < 1024) setShowLibrary(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newSongs: Song[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `user-${Date.now()}-${i}`;
      const song: Song = {
        id, title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Local Artist', album: 'My Uploads',
        coverUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/400/400`, audioUrl: URL.createObjectURL(file),
        duration: 0, color: '#6366f1',
      };
      await saveSongBlob(id, file);
      newSongs.push(song);
    }
    const updatedLibrary = [...library, ...newSongs];
    setLibrary(updatedLibrary);
    setActiveQueueIds(prev => [...newSongs.map(s => s.id), ...prev]);
    await saveLibraryMetadata(updatedLibrary);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePlayAISong = async (title: string, artist: string) => {
    const existing = library.find(s => 
      s.title.toLowerCase().includes(title.toLowerCase()) && 
      s.artist.toLowerCase().includes(artist.toLowerCase())
    );
    if (existing) {
      const idxInQueue = activeQueueIds.indexOf(existing.id);
      if (idxInQueue !== -1) {
        setPlayerState(s => ({ ...s, currentSongIndex: idxInQueue, isPlaying: true, viewMode: 'player' }));
      } else {
        const newQueue = [existing.id, ...activeQueueIds];
        setActiveQueueIds(newQueue);
        setPlayerState(s => ({ ...s, currentSongIndex: 0, isPlaying: true, viewMode: 'player' }));
      }
    } else {
      const virtualId = `online-${Date.now()}`;
      const virtualSong: Song = {
        id: virtualId, title, artist, album: 'Cloud',
        coverUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/400/400`,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        duration: 0, color: '#6366f1'
      };
      setLibrary([...library, virtualSong]);
      const newQueue = [virtualId, ...activeQueueIds];
      setActiveQueueIds(newQueue);
      setPlayerState(s => ({ ...s, currentSongIndex: 0, isPlaying: true, viewMode: 'player' }));
    }
    if (window.innerWidth < 768) setIsAiOpen(false);
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
    audioRef.current.playbackRate = playerState.playbackSpeed;
    if (playerState.isPlaying) {
      initAudioContext();
      audioRef.current.play().catch(() => setPlayerState(s => ({ ...s, isPlaying: false })));
    } else audioRef.current.pause();
  }, [playerState.isPlaying, playerState.playbackSpeed, currentSong?.audioUrl, initAudioContext]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(s => ({ ...s, currentTime: time }));
    }
  };

  const togglePlaybackSpeed = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playerState.playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlayerState(s => ({ ...s, playbackSpeed: speeds[nextIndex] }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSidebarContent = () => {
    if (viewingPlaylistId === null) {
      return (
        <div className="flex-1 flex flex-col min-h-0 h-full">
          <div className="p-6 pb-2 shrink-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Khám phá</h2>
            <div 
              onClick={() => setPlayerState(s => ({ ...s, viewMode: 'explore' }))} 
              className={`group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 border mb-6 ${playerState.viewMode === 'explore' ? 'bg-indigo-600 border-indigo-400 shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shadow-lg"><Compass className="text-white" size={24} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest truncate">Bảng Xếp Hạng</p>
                <p className="text-[9px] text-white/40 font-bold uppercase">Trending Now</p>
              </div>
            </div>

            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Thư viện</h2>
            <div onClick={() => setViewingPlaylistId('all')} className="group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 bg-white/5 border border-white/5 hover:border-white/10 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg"><Music2 className="text-white" size={24} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest truncate">Tất cả bài hát</p>
                <p className="text-[9px] text-white/40 font-bold uppercase">{library.length} bài</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Playlists</h2>
              <button onClick={() => setShowPlaylistStudio(true)} className="p-1 hover:text-indigo-400 transition-colors"><PlusCircle size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 scrollbar-hide">
            {playlists.map(pl => (
              <div key={pl.id} onClick={() => setViewingPlaylistId(pl.id)} className="group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 hover:bg-white/5 border border-transparent hover:border-white/5">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 border border-white/5"><FolderHeart className="text-white/20 group-hover:text-indigo-400" size={20} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate uppercase tracking-tighter">{pl.name}</p>
                  <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">{pl.songIds.length} bài</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const isAll = viewingPlaylistId === 'all';
    const targetPlaylist = !isAll ? playlists.find(p => p.id === viewingPlaylistId) : null;
    const songListIds = isAll ? library.map(s => s.id) : (targetPlaylist?.songIds || []);
    const displaySongs = songListIds.map(id => library.find(s => s.id === id)).filter(Boolean) as Song[];
    return (
      <div className="flex-1 flex flex-col min-h-0 h-full animate-in slide-in-from-right-4 duration-300">
        <div className="p-6 flex flex-col gap-4 shrink-0">
          <button onClick={() => setViewingPlaylistId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"><ChevronLeft size={14} /> Quay lại</button>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black truncate uppercase tracking-tighter italic">{isAll ? "Tất cả bài hát" : targetPlaylist?.name}</h2>
            </div>
            {!isAll && (
              <button onClick={() => setShowPlaylistStudio(true)} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><Settings2 size={16} /></button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-10 space-y-1 scrollbar-hide">
          {displaySongs.map((song, idx) => (
            <div key={song.id} onClick={() => startPlayingQueue(songListIds, idx)} className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${currentSong?.id === song.id ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'}`}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative">
                <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                {currentSong?.id === song.id && playerState.isPlaying && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Waves size={16} className="text-indigo-400 animate-pulse" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-black truncate ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                <p className="text-[9px] text-white/30 truncate uppercase font-bold">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${playerState.theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'} font-sans select-none overflow-hidden relative p-safe-top p-safe-bottom`}>
      {currentSong && (
        <audio 
          ref={audioRef} 
          src={currentSong.audioUrl} 
          crossOrigin="anonymous" 
          onTimeUpdate={() => audioRef.current && setPlayerState(s => ({ ...s, currentTime: audioRef.current!.currentTime }))} 
          onEnded={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % currentQueueSongs.length }))} 
        />
      )}
      
      {showPlaylistStudio && <PlaylistManager playlists={playlists} songs={library} onCreatePlaylist={handleCreatePlaylist} onDeletePlaylist={(id) => { setPlaylists(playlists.filter(p => p.id !== id)); if (viewingPlaylistId === id) setViewingPlaylistId(null); }} onAddToPlaylist={handleAddToPlaylist} onRemoveFromPlaylist={handleRemoveFromPlaylist} onReorderPlaylist={handleReorderPlaylist} onSelectPlaylist={(pl) => { setViewingPlaylistId(pl.id); startPlayingQueue(pl.songIds, 0); setShowPlaylistStudio(false); }} onClose={() => setShowPlaylistStudio(false)} />}

      <header className="p-4 flex items-center justify-between z-50 bg-opacity-80 backdrop-blur-xl border-b border-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg"><Music2 size={18} className="text-white" /></div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">AURA</h1>
          </div>
          <div className="hidden sm:flex gap-1 ml-4">
            <button onClick={() => setPlayerState(s => ({ ...s, viewMode: 'player' }))} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${playerState.viewMode === 'player' ? 'bg-white text-black' : 'text-white/40 hover:bg-white/5'}`}>Player</button>
            <button onClick={() => setPlayerState(s => ({ ...s, viewMode: 'explore' }))} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${playerState.viewMode === 'explore' ? 'bg-white text-black' : 'text-white/40 hover:bg-white/5'}`}>Khám phá</button>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className={`p-2 rounded-xl transition-all ${showLibrary ? 'bg-indigo-500/10 text-indigo-400' : 'text-white/40 hover:bg-white/5'}`}><List size={18} /></button>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"><PlusCircle size={20} /></button>
           <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`glass border-r border-white/5 transition-all duration-500 flex flex-col absolute lg:relative z-[60] h-full ${showLibrary ? 'w-full sm:w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 opacity-0 overflow-hidden'}`}>
          {renderSidebarContent()}
        </aside>

        {showLibrary && <div onClick={() => setShowLibrary(false)} className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"></div>}

        <main className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center p-4 lg:p-10 relative">
          <div className="w-full max-w-6xl flex flex-col items-center">
            {playerState.viewMode === 'explore' ? (
              <Charts 
                categories={MOCK_CHARTS} 
                onPlaySong={handlePlayChartSong}
                onPlayAll={(songs) => startPlayingQueue(songs.map(s => s.id), 0)}
              />
            ) : currentSong ? (
               <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 animate-in fade-in zoom-in-95 duration-500">
                  <div className="shrink-0 text-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 mb-2 block">Now Playing</span>
                    <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-1 truncate uppercase italic leading-tight max-w-[90vw]">{currentSong.title}</h2>
                    <p className="text-sm lg:text-lg text-white/40 font-bold uppercase tracking-widest truncate">{currentSong.artist}</p>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 py-2 relative group">
                    <div className="relative aspect-square max-h-[30dvh] lg:max-h-[45dvh] w-auto h-full rounded-[3rem] lg:rounded-[5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] z-10 shrink border border-white/10">
                      <img src={currentSong.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="" />
                      <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay"></div>
                    </div>
                    <div className="w-full max-w-2xl mt-8 opacity-40 group-hover:opacity-80 transition-opacity">
                       <Visualizer analyser={analyser} color={currentSong.color} type="bars" />
                    </div>
                  </div>

                  <div className="w-full max-w-2xl mt-8 shrink-0 px-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 px-1">
                      <span>{formatTime(playerState.currentTime)}</span>
                      <span>{audioRef.current ? formatTime(audioRef.current.duration || 0) : '0:00'}</span>
                    </div>
                    <div className="relative group/seek h-6 flex items-center">
                      <input 
                        type="range"
                        min="0"
                        max={audioRef.current?.duration || 0}
                        value={playerState.currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none accent-indigo-500 group-hover/seek:h-1.5 transition-all"
                        style={{ background: `linear-gradient(to right, #6366f1 ${(playerState.currentTime / (audioRef.current?.duration || 1)) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-center gap-8 lg:gap-14 mt-6">
                    <button onClick={togglePlaybackSpeed} className="flex flex-col items-center gap-1 group" title="Tốc độ phát">
                      <Gauge size={24} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[9px] font-black text-white/40 group-hover:text-indigo-400">{playerState.playbackSpeed}x</span>
                    </button>
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex - 1 + currentQueueSongs.length) % currentQueueSongs.length }))} className="text-white/20 hover:text-white transition-all hover:scale-110 p-2"><SkipBack size={32} fill="currentColor" /></button>
                    <button onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))} className="w-16 h-16 lg:w-20 lg:h-20 rounded-[2rem] lg:rounded-[3rem] bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl">
                      {playerState.isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
                    </button>
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % currentQueueSongs.length }))} className="text-white/20 hover:text-white transition-all hover:scale-110 p-2"><SkipForward size={32} fill="currentColor" /></button>
                    <div className="w-8 opacity-0 pointer-events-none hidden sm:block"></div>
                  </div>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-20 text-center animate-pulse py-20">
                 <div className="p-12 rounded-full border border-white/5 bg-white/5 mb-8"><Music2 size={80} strokeWidth={1} /></div>
                 <h2 className="text-2xl font-black uppercase tracking-[0.4em] italic">Aura Music</h2>
                 <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-4">Chọn bản nhạc bạn muốn cảm nhận</p>
                 <button 
                  onClick={() => setPlayerState(s => ({ ...s, viewMode: 'explore' }))}
                  className="mt-10 px-8 py-3 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
                 >
                   Khám phá ngay
                 </button>
               </div>
            )}
          </div>
        </main>
      </div>

      <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ${isAiOpen ? 'w-[calc(100vw-3rem)] sm:w-[400px] h-[calc(100dvh-6rem)] lg:h-[600px]' : 'w-16 h-16'}`}>
        {!isAiOpen ? (
          <button onClick={() => setIsAiOpen(true)} className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/40 hover:scale-110 transition-all group border border-white/20"><Sparkles size={28} className="group-hover:rotate-12 transition-transform" /></button>
        ) : (
          <div className="w-full h-full flex flex-col glass rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-4 shrink-0 flex items-center justify-between border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2"><Sparkles className="text-indigo-400" size={18} /><span className="text-[10px] font-black uppercase tracking-widest">Aura Assistant</span></div>
              <button onClick={() => setIsAiOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 min-h-0 bg-black/40"><AIDJ onPlaySong={handlePlayAISong} availableSongs={library} /></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
