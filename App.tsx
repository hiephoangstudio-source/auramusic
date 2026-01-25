
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, 
  Repeat, Shuffle, Search, Heart, ListMusic, 
  Music2, Repeat1, Waves, List, RefreshCw, Upload, Music, Trash2, Globe, ExternalLink, Sparkles
} from 'lucide-react';
import { MOCK_PLAYLIST } from './constants';
import { Song, PlayerState, Playlist } from './types';
import Visualizer from './components/Visualizer';
import AIDJ from './components/AIDJ';
import Lyrics from './components/Lyrics';
import PlaylistManager from './components/PlaylistManager';
import { getSongInsight, getSongStory, searchMusicOnline, OnlineSongResult } from './services/geminiService';
import { saveSongBlob, getSongBlob, deleteSongBlob } from './services/dbService';

const PREVIEW_STREAM = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

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
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<OnlineSongResult[]>([]);
  
  const [activeTab, setActiveTab] = useState<'ai' | 'lyrics' | 'story'>('ai');
  const [showLibrary, setShowLibrary] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [songStory, setSongStory] = useState<string | null>(null);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      setIsLibraryLoading(true);
      const savedMetadata = localStorage.getItem('aura_library_metadata');
      if (!savedMetadata) {
        setLibrary(MOCK_PLAYLIST);
      } else {
        const metadata: Song[] = JSON.parse(savedMetadata);
        const loadedSongs: Song[] = [];
        for (const song of metadata) {
          if (song.id.startsWith('user')) {
            const blob = await getSongBlob(song.id);
            if (blob) loadedSongs.push({ ...song, audioUrl: URL.createObjectURL(blob) });
          } else {
            loadedSongs.push(song);
          }
        }
        setLibrary(loadedSongs.length > 0 ? loadedSongs : MOCK_PLAYLIST);
      }
      setIsLibraryLoading(false);
    };
    loadLibrary();
  }, []);

  useEffect(() => {
    if (!isLibraryLoading) {
      const metadata = library.filter(s => !s.id.startsWith('online')).map(({ audioUrl, ...rest }) => rest);
      localStorage.setItem('aura_library_metadata', JSON.stringify(metadata));
    }
  }, [library, isLibraryLoading]);

  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingOnline(true);
    const results = await searchMusicOnline(searchQuery);
    setOnlineResults(results);
    setIsSearchingOnline(false);
  };

  const currentSong = useMemo(() => {
    if (library.length === 0) return null;
    return library[playerState.currentSongIndex] || library[0];
  }, [playerState.currentSongIndex, library]);

  const handlePlaySong = (song: Song | OnlineSongResult) => {
    // Nếu là kết quả online, kiểm tra xem đã có trong library chưa
    const existingIdx = library.findIndex(s => s.title === song.title && s.artist === song.artist);
    
    if (existingIdx !== -1) {
      setPlayerState(s => ({ ...s, currentSongIndex: existingIdx, isPlaying: true, currentTime: 0 }));
    } else {
      // Tạo track ảo từ kết quả online
      const newTrack: Song = {
        id: `online-${Date.now()}`,
        title: song.title,
        artist: song.artist,
        album: (song as OnlineSongResult).album || "Online Stream",
        coverUrl: (song as OnlineSongResult).coverUrl || `https://picsum.photos/seed/${song.title}/400/400`,
        audioUrl: PREVIEW_STREAM, // Stream demo
        duration: 0,
        color: "#6366f1"
      };
      const newLibrary = [...library, newTrack];
      setLibrary(newLibrary);
      setPlayerState(s => ({ ...s, currentSongIndex: newLibrary.length - 1, isPlaying: true, currentTime: 0 }));
    }
    setOnlineResults([]); // Đóng kết quả tìm kiếm sau khi chọn
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

  useEffect(() => {
    if (currentSong) {
      getSongInsight(currentSong.title, currentSong.artist).then(setInsight);
      if (activeTab === 'story') {
        setIsStoryLoading(true);
        getSongStory(currentSong.title, currentSong.artist).then(s => { setSongStory(s); setIsStoryLoading(false); });
      }
    }
  }, [currentSong?.id, activeTab]);

  return (
    <div className={`h-screen flex flex-col ${playerState.theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'} font-sans select-none overflow-hidden`}>
      {currentSong && (
        <audio 
          ref={audioRef} src={currentSong.audioUrl} crossOrigin="anonymous"
          onTimeUpdate={() => audioRef.current && setPlayerState(s => ({ ...s, currentTime: audioRef.current!.currentTime }))}
          onEnded={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % library.length }))}
        />
      )}

      {/* Header */}
      <header className="p-4 flex items-center justify-between z-30 bg-opacity-80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Music2 size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter">AURA</h1>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className="p-2 hover:bg-white/10 rounded-xl text-white/60">
            <List size={18} />
          </button>
        </div>
        
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={(e) => { e.preventDefault(); handleOnlineSearch(); }} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" placeholder="Tìm nhạc online..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-11 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 text-[10px] font-black uppercase">
                {isSearchingOnline ? <RefreshCw size={12} className="animate-spin" /> : "Search Web"}
              </button>
            )}
          </form>
        </div>

        <div className="flex items-center gap-4">
           <button className="p-2 text-white/40 hover:text-white transition-all"><Upload size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`glass border-r border-white/5 transition-all duration-500 flex flex-col ${showLibrary ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              {onlineResults.length > 0 ? "Kết quả từ Web" : "Thư viện nhạc"}
            </h2>
            {onlineResults.length > 0 && (
              <button onClick={() => setOnlineResults([])} className="text-[10px] font-bold text-indigo-400">Đóng</button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
            {onlineResults.length > 0 ? (
              onlineResults.map((song, i) => (
                <div key={i} onClick={() => handlePlaySong(song)} className="group p-3 rounded-2xl cursor-pointer hover:bg-indigo-500/10 transition-all flex items-center gap-3 border border-transparent hover:border-indigo-500/20">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-white/5">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                       <Play size={16} fill="white" className="text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-white group-hover:text-indigo-400">{song.title}</p>
                    <p className="text-[10px] text-white/30 truncate uppercase tracking-wider font-bold">{song.artist}</p>
                  </div>
                  <Globe size={12} className="text-indigo-400/40" />
                </div>
              ))
            ) : (
              library.map((song, idx) => (
                <div key={song.id} onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: idx, isPlaying: true, currentTime: 0 }))} className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${currentSong?.id === song.id ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'} border`}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                    <p className="text-[10px] text-white/30 truncate uppercase tracking-wider font-bold">{song.artist}</p>
                  </div>
                  {song.id.startsWith('online') && <Globe size={10} className="text-indigo-400/40" />}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Player Area */}
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-hidden">
          <div className="flex-1 glass rounded-[3.5rem] p-10 flex flex-col relative overflow-hidden">
             {currentSong ? (
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1 block">Aura Playing</span>
                      <h2 className="text-3xl font-black tracking-tight mb-0.5">{currentSong.title}</h2>
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest">{currentSong.artist}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-64 h-64 rounded-[4rem] overflow-hidden shadow-2xl transition-all hover:scale-105 duration-700">
                       <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="w-full max-w-xl mt-10">
                       <Visualizer analyser={analyser} color={currentSong.color} type="bars" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-10 mt-auto">
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex - 1 + library.length) % library.length }))} className="text-white/30 hover:text-white transition-all"><SkipBack size={32} fill="currentColor" /></button>
                    <button onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))} className="w-20 h-20 rounded-[2.5rem] bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                      {playerState.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % library.length }))} className="text-white/30 hover:text-white transition-all"><SkipForward size={32} fill="currentColor" /></button>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-20">
                 <Music2 size={80} strokeWidth={1} className="mb-6" />
                 <h2 className="text-xl font-black uppercase tracking-widest">Aura Assistant</h2>
               </div>
             )}
          </div>

          <div className="w-full lg:w-[400px] flex flex-col gap-6">
            <div className="glass rounded-[2rem] p-1.5 flex bg-white/5">
               {(['ai', 'lyrics', 'story'] as const).map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-white/40'}`}>
                   {tab === 'ai' ? 'AI Assistant' : tab === 'lyrics' ? 'Lyrics' : 'Deep Story'}
                 </button>
               ))}
            </div>
            <div className="flex-1 min-h-[400px]">
               {activeTab === 'ai' && <AIDJ onPlaySong={(title, artist) => handlePlaySong({ title, artist } as any)} availableSongs={library} />}
               {activeTab === 'lyrics' && <div className="glass rounded-[3.5rem] h-full p-8"><Lyrics lyrics={currentSong?.lyrics || []} currentTime={playerState.currentTime} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} color={currentSong?.color || '#fff'} /></div>}
               {activeTab === 'story' && (
                 <div className="glass rounded-[3.5rem] h-full p-10 overflow-y-auto scrollbar-hide flex flex-col">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Sparkles className="text-indigo-400" size={20} /> Deep Story</h3>
                    {isStoryLoading ? <RefreshCw className="animate-spin text-white/20 mx-auto" /> : <p className="text-sm font-medium leading-relaxed italic text-white/80">"{songStory}"</p>}
                    {insight && <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-widest leading-loose">{insight}</div>}
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
