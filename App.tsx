
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Search, Waves, List, RefreshCw, Upload, Trash2, Globe, ExternalLink, Sparkles, X, Loader2, AlertCircle, Key, Music2, Download, Copy, Check, Info, FileJson, Share, PlusCircle, HelpCircle, FolderHeart
} from 'lucide-react';
import { MOCK_PLAYLIST } from './constants';
import { Song, PlayerState, Playlist } from './types';
import Visualizer from './components/Visualizer';
import AIDJ from './components/AIDJ';
import Lyrics from './components/Lyrics';
import PlaylistManager from './components/PlaylistManager';
import { getSongInsight, getSongStory, searchMusicOnline, OnlineSongResult } from './services/geminiService';
import { saveSongBlob, getSongBlob, deleteSongBlob, saveLibraryMetadata, getLibraryMetadata, isLibraryInitialized, markLibraryInitialized } from './services/dbService';

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
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('aura_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<OnlineSongResult[]>([]);
  
  const [activeTab, setActiveTab] = useState<'ai' | 'lyrics' | 'story'>('ai');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [songStory, setSongStory] = useState<string | null>(null);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [globalError, setGlobalError] = useState<{code: string, message?: string} | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
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
        
        if (!initialized) {
          setLibrary(MOCK_PLAYLIST);
          await saveLibraryMetadata(MOCK_PLAYLIST);
          await markLibraryInitialized();
        } else {
          const loadedSongs: Song[] = [];
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
          setLibrary(loadedSongs);
        }
      } catch (err) {
        setLibrary(MOCK_PLAYLIST);
      }
      setIsLibraryLoading(false);
    };
    loadLibrary();
  }, []);

  const syncStorage = async (lib: Song[]) => {
    await saveLibraryMetadata(lib);
  };

  const currentSong = useMemo(() => {
    if (library.length === 0) return null;
    return library[playerState.currentSongIndex] || library[0];
  }, [playerState.currentSongIndex, library]);

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
    if ('vibrate' in navigator) navigator.vibrate(20);
  };

  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, songIds: pl.songIds.filter(id => id !== songId) };
      }
      return pl;
    }));
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const playlistSongs = library.filter(s => playlist.songIds.includes(s.id));
    if (playlistSongs.length > 0) {
      const firstSongId = playlistSongs[0].id;
      const indexInLib = library.findIndex(s => s.id === firstSongId);
      setPlayerState(s => ({ ...s, currentSongIndex: indexInLib, isPlaying: true, currentTime: 0 }));
      setShowPlaylists(false);
    }
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
        artist: "Offline",
        album: "My Phone",
        coverUrl: `https://picsum.photos/seed/${id}/400/400`,
        audioUrl: URL.createObjectURL(file),
        duration: 0,
        color: "#a855f7"
      });
    }
    const nextLib = [...library, ...newSongs];
    setLibrary(nextLib);
    await syncStorage(nextLib);
    setIsUploading(false);
  };

  return (
    <div className={`h-screen flex flex-col ${playerState.theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'} font-sans select-none overflow-hidden relative pb-safe`}>
      {currentSong && (
        <audio 
          ref={audioRef} src={currentSong.audioUrl} crossOrigin="anonymous"
          onTimeUpdate={() => audioRef.current && setPlayerState(s => ({ ...s, currentTime: audioRef.current!.currentTime }))}
          onEnded={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % library.length }))}
        />
      )}

      {showPlaylists && (
        <PlaylistManager 
          playlists={playlists}
          songs={library}
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={(id) => setPlaylists(playlists.filter(p => p.id !== id))}
          onAddToPlaylist={handleAddToPlaylist}
          onRemoveFromPlaylist={handleRemoveFromPlaylist}
          onSelectPlaylist={handlePlayPlaylist}
          onClose={() => setShowPlaylists(false)}
        />
      )}

      {/* Help Modal */}
      {showSyncModal && (
        <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="glass max-w-lg w-full p-8 rounded-[3rem] border-indigo-500/20 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 mb-6 shrink-0">
                <HelpCircle size={28} />
              </div>
              <div className="text-center mb-8 shrink-0">
                <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-indigo-400">Trợ giúp</h3>
                <div className="flex flex-col gap-4 mt-6 text-left">
                   <div className="p-4 bg-white/5 rounded-2xl flex gap-4 items-start border border-white/5">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0"><FolderHeart size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/80 mb-1">Kéo & Thả Playlist</p>
                        <p className="text-[9px] text-white/40 leading-relaxed font-medium">Trong mục <b>Playlist</b>, bạn có thể nhấn giữ một bài hát ở danh sách bên dưới và kéo thả nó lên khu vực phía trên để thêm vào danh sách phát.</p>
                      </div>
                   </div>
                </div>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-[9px] text-white/20 uppercase font-black tracking-widest hover:text-white transition-colors pt-4 shrink-0">Đóng</button>
           </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 z-[120] bg-black/80 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Aura đang nạp nhạc...</p>
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
          <button onClick={() => setShowPlaylists(true)} className={`p-2 rounded-xl text-white/40 hover:bg-white/5`}><FolderHeart size={18} /></button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           <button onClick={() => setShowSyncModal(true)} className="p-2 text-white/40 hover:text-white"><HelpCircle size={22} /></button>
           <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-400 hover:text-white bg-indigo-500/10 rounded-xl"><PlusCircle size={20} /></button>
           <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`glass border-r border-white/5 transition-all duration-500 flex flex-col ${showLibrary ? 'w-full sm:w-80 opacity-100 absolute sm:relative z-40 h-full' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Thư viện Aura</h2>
            <button onClick={() => setShowLibrary(false)} className="sm:hidden p-2 text-white/40"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
            {library.map((song) => (
              <div key={song.id} 
                onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: library.findIndex(lb => lb.id === song.id), isPlaying: true, currentTime: 0 }))} 
                className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${currentSong?.id === song.id ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'} border`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                  <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                  {currentSong?.id === song.id && playerState.isPlaying && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Waves size={16} className="text-indigo-400 animate-pulse" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                  <p className="text-[10px] text-white/30 truncate uppercase font-bold">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-y-auto sm:overflow-hidden scrollbar-hide">
          <div className="flex-1 glass rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 flex flex-col relative overflow-hidden min-h-[500px]">
             {currentSong ? (
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 mb-1 block">Aura Playing</span>
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-0.5 truncate">{currentSong.title}</h2>
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest truncate">{currentSong.artist}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-10">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-[3rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative z-10">
                      <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="w-full max-w-xl mt-12 hidden sm:block">
                       <Visualizer analyser={analyser} color={currentSong.color} type="bars" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 sm:gap-10 mt-auto pt-6">
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex - 1 + library.length) % library.length }))} className="text-white/30 hover:text-white"><SkipBack size={30} fill="currentColor" /></button>
                    <button onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))} className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] sm:rounded-[2.5rem] bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-500/10">
                      {playerState.isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % library.length }))} className="text-white/30 hover:text-white"><SkipForward size={30} fill="currentColor" /></button>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-20 text-center py-20">
                 <div className="p-8 sm:p-10 rounded-full border border-white/5 bg-white/5 mb-6"><Music2 size={60} strokeWidth={1} /></div>
                 <h2 className="text-lg font-black uppercase tracking-widest">Aura Assistant</h2>
                 <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Bấm (+) để nạp nhạc</p>
               </div>
             )}
          </div>

          <div className="w-full lg:w-[400px] flex flex-col gap-6">
            <div className="glass rounded-[2rem] p-1.5 flex bg-white/5 shrink-0">
               {(['ai', 'lyrics', 'story'] as const).map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-white/40 hover:text-white/60'}`}>
                   {tab === 'ai' ? 'Assistant' : tab === 'lyrics' ? 'Lyrics' : 'Story'}
                 </button>
               ))}
            </div>
            <div className="flex-1 min-h-[400px]">
               {activeTab === 'ai' && <AIDJ onPlaySong={(title, artist) => {}} availableSongs={library} />}
               {activeTab === 'lyrics' && <div className="glass rounded-[2.5rem] sm:rounded-[3.5rem] h-full p-6 sm:p-8"><Lyrics lyrics={currentSong?.lyrics || []} currentTime={playerState.currentTime} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} color={currentSong?.color || '#fff'} /></div>}
               {activeTab === 'story' && (
                 <div className="glass rounded-[2.5rem] sm:rounded-[3.5rem] h-full p-8 sm:p-10 overflow-y-auto scrollbar-hide flex flex-col">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3"><Sparkles className="text-indigo-400" size={20} /> Deep Story</h3>
                    {isStoryLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20"><RefreshCw className="animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest">Generating...</span></div>
                    ) : (
                      <div className="space-y-6"><p className="text-sm sm:text-base font-medium leading-relaxed italic text-white/80">"{songStory || 'Aura đang lắng nghe...'}"</p></div>
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
