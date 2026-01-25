
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, 
  Repeat, Shuffle, Search, Heart, ListMusic, Mic2,
  Music2, Repeat1, Star, Radio, Waves, Square, 
  Circle as CircleIcon, Palette, Clock, List, 
  MonitorPlay, X, BookOpen, RefreshCw, Filter, SortAsc, SortDesc, Upload, Music, Menu, ChevronLeft, ChevronRight
} from 'lucide-react';
import { MOCK_PLAYLIST } from './constants';
import { Song, PlayerState, Playlist, RepeatMode, VisualizerType, ThemeMode, ViewMode, VisualizerTheme } from './types';
import Visualizer from './components/Visualizer';
import AIDJ from './components/AIDJ';
import Lyrics from './components/Lyrics';
import PlaylistManager from './components/PlaylistManager';
import { getSongInsight, getSongStory } from './services/geminiService';

const PLAYER_STATE_KEY = 'aura_player_state_v11';
const RATINGS_KEY = 'aura_ratings_v11';
const FAVORITES_KEY = 'aura_favorites_v11';
const PLAYLISTS_KEY = 'aura_playlists_v11';

const App: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem(PLAYER_STATE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, isPlaying: false, currentTime: 0, sleepTimerMinutes: null };
      } catch (e) { console.error(e); }
    }
    return {
      isPlaying: false,
      currentSongIndex: 0,
      currentTime: 0,
      volume: 0.7,
      isShuffle: false,
      repeatMode: 'none',
      visualizerType: 'bars',
      visualizerTheme: 'default',
      visualEffect: 'none',
      theme: 'dark',
      accentColor: '#6366f1',
      playbackSpeed: 1.0,
      viewMode: 'player',
      sleepTimerMinutes: null
    };
  });

  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'lyrics' | 'story'>('ai');
  const [showLibrary, setShowLibrary] = useState(true);
  
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem(PLAYLISTS_KEY);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [songStory, setSongStory] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const fullLibrary = useMemo(() => {
    const combined = [...MOCK_PLAYLIST, ...userSongs];
    if (!searchQuery) return combined;
    return combined.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userSongs, searchQuery]);

  const currentSong = useMemo(() => {
    // Đảm bảo index luôn hợp lệ sau khi library thay đổi
    const idx = playerState.currentSongIndex;
    return fullLibrary[idx] || fullLibrary[0] || MOCK_PLAYLIST[0];
  }, [playerState.currentSongIndex, fullLibrary]);

  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists)); }, [playlists]);

  useEffect(() => {
    const { isPlaying, currentTime, ...saveable } = playerState;
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(saveable));
  }, [playerState]);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current && audioRef.current) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
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
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = playerState.volume;
    if (playerState.isPlaying) {
      initAudioContext();
      audioRef.current.play().catch(() => setPlayerState(s => ({ ...s, isPlaying: false })));
    } else {
      audioRef.current.pause();
    }
  }, [playerState.isPlaying, currentSong.audioUrl, initAudioContext]);

  const handleNext = useCallback(() => {
    setPlayerState(s => {
      let nextIndex = s.currentSongIndex + 1;
      if (s.repeatMode === 'one') return { ...s, currentTime: 0, isPlaying: true };
      if (s.isShuffle) nextIndex = Math.floor(Math.random() * fullLibrary.length);
      else if (nextIndex >= fullLibrary.length) {
        if (s.repeatMode === 'all') nextIndex = 0;
        else return { ...s, isPlaying: false };
      }
      return { ...s, currentSongIndex: nextIndex, currentTime: 0, isPlaying: true };
    });
  }, [fullLibrary.length]);

  const handlePrev = useCallback(() => {
    setPlayerState(s => {
      let prevIndex = s.currentSongIndex - 1;
      if (prevIndex < 0) prevIndex = fullLibrary.length - 1;
      return { ...s, currentSongIndex: prevIndex, currentTime: 0, isPlaying: true };
    });
  }, [fullLibrary.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newSongs: Song[] = Array.from(files).map((file, idx) => {
      const url = URL.createObjectURL(file);
      return {
        id: `user-${Date.now()}-${idx}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Nhạc của tôi",
        album: "Local Storage",
        coverUrl: `https://picsum.photos/seed/${Math.random()}/400/400`,
        audioUrl: url,
        duration: 0,
        color: "#" + Math.floor(Math.random()*16777215).toString(16)
      };
    });

    const startIdx = fullLibrary.length;
    setUserSongs(prev => [...prev, ...newSongs]);
    // Phát bài đầu tiên trong số các bài vừa tải lên
    setPlayerState(s => ({ ...s, currentSongIndex: startIdx, isPlaying: true, currentTime: 0 }));
  };

  const handlePlayByIndex = (index: number) => {
    setPlayerState(s => ({ ...s, currentSongIndex: index, isPlaying: true, currentTime: 0 }));
  };

  useEffect(() => {
    if (currentSong) {
      setIsInsightLoading(true);
      getSongInsight(currentSong.title, currentSong.artist).then(i => { setInsight(i); setIsInsightLoading(false); });
      if (activeTab === 'story') {
        setIsStoryLoading(true);
        getSongStory(currentSong.title, currentSong.artist).then(s => { setSongStory(s); setIsStoryLoading(false); });
      }
    }
  }, [currentSong.id, activeTab]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`h-screen transition-colors duration-700 flex flex-col ${playerState.theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'} font-sans select-none overflow-hidden`}>
      <audio 
        ref={audioRef} 
        src={currentSong.audioUrl} 
        crossOrigin="anonymous"
        onTimeUpdate={() => audioRef.current && setPlayerState(s => ({ ...s, currentTime: audioRef.current!.currentTime }))}
        onEnded={handleNext}
        onLoadedMetadata={() => {
          if (currentSong.id.startsWith('user') && audioRef.current) {
            setUserSongs(prev => prev.map(s => s.id === currentSong.id ? { ...s, duration: audioRef.current!.duration } : s));
          }
        }}
      />
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="audio/*" className="hidden" />

      {/* Header */}
      <header className="p-4 flex items-center justify-between z-30 bg-opacity-80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter hidden sm:block">AURA</h1>
          </div>
          <button 
            onClick={() => setShowLibrary(!showLibrary)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60"
          >
            <List size={18} />
            <span className="hidden md:inline">Thư viện</span>
          </button>
        </div>
        
        <div className="flex-1 max-w-md mx-4 md:mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" 
              placeholder="Tìm bài hát, nghệ sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-11 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 md:px-4 md:py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
            title="Tải nhạc lên"
          >
            <Upload size={16} />
            <span className="hidden lg:inline uppercase tracking-widest text-[10px]">Tải nhạc</span>
          </button>
          <button onClick={() => setShowPlaylistManager(true)} className="p-2 hover:bg-white/5 rounded-full text-white/60" title="Playlists">
            <ListMusic size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Song List */}
        <aside 
          className={`glass border-r border-white/5 transition-all duration-500 flex flex-col ${showLibrary ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}
        >
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Danh sách bài hát</h2>
            <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full text-indigo-400">{fullLibrary.length} bài</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-10 space-y-1 scrollbar-hide">
            {fullLibrary.map((song, idx) => {
              const isCurrent = currentSong.id === song.id;
              return (
                <div 
                  key={song.id}
                  onClick={() => handlePlayByIndex(idx)}
                  className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${isCurrent ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    {isCurrent && playerState.isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Waves className="text-white animate-pulse" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                    <p className="text-[10px] text-white/30 truncate uppercase tracking-wider">{song.artist}</p>
                  </div>
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Player */}
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-hidden relative">
          <div className="flex-1 glass rounded-[2.5rem] lg:rounded-[3.5rem] p-6 lg:p-10 flex flex-col relative overflow-hidden group">
            <div 
              className="absolute inset-0 opacity-10 blur-[120px] transition-all duration-1000 pointer-events-none"
              style={{ backgroundColor: currentSong.color }}
            />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1 block">Now Playing</span>
                  <h2 className="text-xl lg:text-3xl font-black tracking-tight mb-0.5 truncate max-w-[250px] lg:max-w-none">{currentSong.title}</h2>
                  <p className="text-xs lg:text-sm text-white/40 font-bold uppercase tracking-widest truncate">{currentSong.artist}</p>
                </div>
                <button 
                  onClick={() => setFavorites(prev => prev.includes(currentSong.id) ? prev.filter(id => id !== currentSong.id) : [...prev, currentSong.id])}
                  className={`p-3 lg:p-4 rounded-2xl lg:rounded-3xl transition-all ${favorites.includes(currentSong.id) ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  <Heart size={20} fill={favorites.includes(currentSong.id) ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-6 lg:gap-10 py-4">
                <div className="relative">
                  <div className={`w-40 h-40 lg:w-60 lg:h-60 rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden shadow-2xl transition-all duration-1000 ${playerState.isPlaying ? 'scale-105 shadow-indigo-500/20' : 'scale-95 grayscale-[0.5]'}`}>
                    <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="w-full max-w-xl">
                   <Visualizer analyser={analyser} color={currentSong.color} type={playerState.visualizerType} theme={playerState.visualizerTheme} />
                   
                   <div className="mt-6 lg:mt-8 space-y-3">
                      <input 
                        type="range" 
                        min="0" 
                        max={currentSong.duration || 100} 
                        value={playerState.currentTime}
                        onChange={(e) => {
                          const time = Number(e.target.value);
                          if (audioRef.current) audioRef.current.currentTime = time;
                        }}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-white/30 tracking-widest">
                        <span>{formatTime(playerState.currentTime)}</span>
                        <span>{formatTime(currentSong.duration)}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 lg:gap-10 mt-auto">
                <button onClick={() => setPlayerState(s => ({ ...s, isShuffle: !s.isShuffle }))} className={`transition-all ${playerState.isShuffle ? 'text-indigo-400' : 'text-white/20 hover:text-white/40'}`}>
                  <Shuffle size={18} />
                </button>
                
                <div className="flex items-center gap-4 lg:gap-8">
                  <button onClick={handlePrev} className="text-white/30 hover:text-white transition-all">
                    <SkipBack size={24} lg-size={28} fill="currentColor" />
                  </button>
                  <button 
                    onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-[2rem] lg:rounded-[2.5rem] bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                  >
                    {playerState.isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={handleNext} className="text-white/30 hover:text-white transition-all">
                    <SkipForward size={24} lg-size={28} fill="currentColor" />
                  </button>
                </div>

                <button 
                  onClick={() => setPlayerState(s => ({ ...s, repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none' }))}
                  className={`transition-all ${playerState.repeatMode !== 'none' ? 'text-indigo-400' : 'text-white/20 hover:text-white/40'}`}
                >
                  {playerState.repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: AI Assistant & Lyrics */}
          <div className="w-full lg:w-[400px] flex flex-col gap-6 lg:h-full">
            <div className="glass rounded-[2rem] lg:rounded-[3rem] p-1.5 flex bg-white/5">
               {(['ai', 'lyrics', 'story'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-2.5 rounded-[1.5rem] lg:rounded-[2.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}
                 >
                   {tab === 'ai' && 'AI DJ'}
                   {tab === 'lyrics' && 'Lời nhạc'}
                   {tab === 'story' && 'Deep Story'}
                 </button>
               ))}
            </div>

            <div className="flex-1 min-h-[350px] lg:min-h-0">
               {activeTab === 'ai' && <AIDJ onPlaySong={(title) => {
                 const idx = fullLibrary.findIndex(s => s.title.toLowerCase().includes(title.toLowerCase()));
                 if (idx !== -1) handlePlayByIndex(idx);
               }} availableSongs={fullLibrary} />}
               
               {activeTab === 'lyrics' && (
                 <div className="glass rounded-[2.5rem] lg:rounded-[3.5rem] h-full p-6 lg:p-8 overflow-hidden relative">
                   <Lyrics lyrics={currentSong.lyrics || []} currentTime={playerState.currentTime} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} color={currentSong.color} />
                 </div>
               )}
               
               {activeTab === 'story' && (
                 <div className="glass rounded-[2.5rem] lg:rounded-[3.5rem] h-full p-6 lg:p-10 overflow-y-auto scrollbar-hide flex flex-col">
                    <div className="mb-6">
                      <BookOpen className="text-indigo-400 mb-4" size={28} />
                      <h3 className="text-lg lg:text-xl font-black">Câu chuyện âm nhạc</h3>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">AI Storytelling by Gemini</p>
                    </div>
                    {isStoryLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                         <RefreshCw className="animate-spin mb-2" size={32} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Đang viết...</span>
                      </div>
                    ) : (
                      <div className="space-y-6">
                         <p className="text-sm lg:text-base font-medium leading-relaxed italic text-white/80">"{songStory || "Hãy để âm nhạc kể câu chuyện của chính nó..."}"</p>
                         <div className="pt-6 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-3">AI Insight</p>
                            <p className="text-[11px] lg:text-xs text-white/50 leading-relaxed font-medium uppercase tracking-wider">{insight}</p>
                         </div>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </main>
      </div>

      {/* Mini Player / Footer */}
      <footer className="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-black/40 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4 w-1/3">
           <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
             <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="" />
           </div>
           <div className="min-w-0 hidden sm:block">
             <p className="text-sm font-bold truncate text-white">{currentSong.title}</p>
             <p className="text-[10px] text-white/30 truncate uppercase tracking-widest font-bold">{currentSong.artist}</p>
           </div>
        </div>

        <div className="flex items-center gap-6 w-1/3 justify-center">
          <div className="hidden lg:flex items-center gap-4 text-white/40">
             <Volume2 size={16} />
             <input 
              type="range" min="0" max="1" step="0.01" value={playerState.volume}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPlayerState(s => ({ ...s, volume: val }));
                if (audioRef.current) audioRef.current.volume = val;
              }}
              className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-1/3 justify-end">
          <button 
            onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))}
            className="p-3 rounded-2xl bg-white text-black hover:scale-105 active:scale-95 transition-all"
          >
            {playerState.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
      </footer>

      {showPlaylistManager && (
        <PlaylistManager 
          playlists={playlists} songs={fullLibrary} onClose={() => setShowPlaylistManager(false)}
          onCreatePlaylist={(name) => setPlaylists([...playlists, { id: Date.now().toString(), name, songIds: [] }])}
          onDeletePlaylist={(id) => setPlaylists(playlists.filter(p => p.id !== id))}
          onAddToPlaylist={(pid, sid) => setPlaylists(playlists.map(p => p.id === pid ? { ...p, songIds: [...p.songIds, sid] } : p))}
          onRemoveFromPlaylist={(pid, sid) => setPlaylists(playlists.map(p => p.id === pid ? { ...p, songIds: p.songIds.filter(id => id !== sid) } : p))}
          onSelectPlaylist={(p) => {
             const songIdx = fullLibrary.findIndex(s => s.id === p.songIds[0]);
             if (songIdx !== -1) handlePlayByIndex(songIdx);
             setShowPlaylistManager(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
