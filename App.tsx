
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Search, Waves, List, RefreshCw, Upload, Trash2, Globe, ExternalLink, Sparkles, X, Loader2, AlertCircle, Key, Music2, Download, Copy, Check, Info, FileJson, Share, PlusCircle, HelpCircle
} from 'lucide-react';
import { MOCK_PLAYLIST } from './constants';
import { Song, PlayerState } from './types';
import Visualizer from './components/Visualizer';
import AIDJ from './components/AIDJ';
import Lyrics from './components/Lyrics';
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
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<OnlineSongResult[]>([]);
  
  const [activeTab, setActiveTab] = useState<'ai' | 'lyrics' | 'story'>('ai');
  const [showLibrary, setShowLibrary] = useState(false);
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

  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingOnline(true);
    setOnlineResults([]); 
    const results = await searchMusicOnline(searchQuery);
    if (results && results.error) {
      setGlobalError(results);
    } else {
      setOnlineResults(results);
      setGlobalError(null);
    }
    setIsSearchingOnline(false);
  };

  const currentSong = useMemo(() => {
    if (library.length === 0) return null;
    return library[playerState.currentSongIndex] || library[0];
  }, [playerState.currentSongIndex, library]);

  const handlePlaySong = (song: Song | OnlineSongResult) => {
    const existingIdx = library.findIndex(s => s.title === song.title && s.artist === song.artist);
    if (existingIdx !== -1) {
      setPlayerState(s => ({ ...s, currentSongIndex: existingIdx, isPlaying: true, currentTime: 0 }));
    } else {
      const newTrack: Song = {
        id: `online-${Date.now()}`,
        title: song.title,
        artist: song.artist,
        album: (song as OnlineSongResult).album || "Web",
        coverUrl: (song as OnlineSongResult).coverUrl || `https://picsum.photos/seed/${encodeURIComponent(song.title)}/400/400`,
        audioUrl: PREVIEW_STREAM,
        duration: 0,
        color: "#6366f1"
      };
      const nextLib = [...library, newTrack];
      setLibrary(nextLib);
      setPlayerState(s => ({ ...s, currentSongIndex: nextLib.length - 1, isPlaying: true, currentTime: 0 }));
    }
    setOnlineResults([]);
    setSearchQuery('');
  };

  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Xóa bài hát này khỏi thư viện Aura?")) return;
    await deleteSongBlob(id);
    const indexToDelete = library.findIndex(s => s.id === id);
    const newLib = library.filter(s => s.id !== id);
    setLibrary(newLib);
    await syncStorage(newLib);
    setPlayerState(s => {
      let nextIndex = s.currentSongIndex;
      if (indexToDelete === s.currentSongIndex) nextIndex = 0;
      else if (indexToDelete < s.currentSongIndex) nextIndex = Math.max(0, s.currentSongIndex - 1);
      return { ...s, currentSongIndex: nextIndex, isPlaying: indexToDelete === s.currentSongIndex ? false : s.isPlaying };
    });
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
      getSongInsight(currentSong.title, currentSong.artist).then(res => {
        if (res && res.error) setGlobalError(res);
        else setInsight(res);
      });
      if (activeTab === 'story') {
        setIsStoryLoading(true);
        getSongStory(currentSong.title, currentSong.artist).then(res => {
          if (res && res.error) setGlobalError(res);
          else setSongStory(res);
          setIsStoryLoading(false);
        });
      }
    }
  }, [currentSong?.id, activeTab]);

  const filteredLibrary = useMemo(() => {
    if (!searchQuery) return library;
    return library.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [library, searchQuery]);

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
    if (files.length > 0) alert(`Đã nạp ${files.length} bài hát vào Aura!`);
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

      {/* Sync & Comprehensive Help Modal */}
      {showSyncModal && (
        <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="glass max-w-lg w-full p-8 rounded-[3rem] border-indigo-500/20 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 mb-6 shrink-0">
                <HelpCircle size={28} />
              </div>
              
              <div className="text-center mb-8 shrink-0">
                <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-indigo-400">Hướng dẫn Aura</h3>
                <div className="flex flex-col gap-4 mt-6 text-left">
                   <div className="p-4 bg-white/5 rounded-2xl flex gap-4 items-start border border-white/5">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0"><Share size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/80 mb-1">Cài app trên iPhone (iOS)</p>
                        <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                          Mở Safari {"\u2192"} Bấm <b>Chia sẻ</b> {"\u2192"} <b>Thêm vào MH chính</b>. App sẽ chạy mượt hơn và có thể nghe nhạc khi tắt màn hình.
                        </p>
                      </div>
                   </div>
                   <div className="p-4 bg-indigo-500/5 rounded-2xl flex gap-4 items-start border border-indigo-500/10">
                      <div className="p-2 bg-indigo-400/20 rounded-lg text-indigo-400 shrink-0"><PlusCircle size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/80 mb-1">Cách nạp nhạc từ điện thoại</p>
                        <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                          Apple chặn quét tự động. Hãy bấm nút <b>(+)</b> {"\u2192"} chọn <b>Tệp (Files)</b> {"\u2192"} chọn các bài nhạc trong máy. Aura sẽ lưu chúng vĩnh viễn trong bộ nhớ App.
                        </p>
                      </div>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl flex gap-4 items-start border border-white/5">
                      <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0"><Globe size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/80 mb-1">Tìm nhạc trên Web</p>
                        <p className="text-[9px] text-white/40 leading-relaxed font-medium">Dùng thanh tìm kiếm hoặc AI DJ để Aura tự "lùng sục" bài hát trên internet cho bạn.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 shrink-0">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="py-5 bg-indigo-500 hover:bg-indigo-600 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <PlusCircle className="text-white" />
                  <span className="text-[9px] text-white font-black uppercase tracking-widest">Nạp nhạc máy</span>
                </button>
                <button 
                  onClick={() => setShowSyncModal(false)}
                  className="py-5 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-3 transition-all"
                >
                  <RefreshCw className="text-white/40" />
                  <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Đồng bộ</span>
                </button>
              </div>

              <button 
                onClick={() => setShowSyncModal(false)} 
                className="text-[9px] text-white/20 uppercase font-black tracking-widest hover:text-white transition-colors pt-4 shrink-0"
              >
                Đóng
              </button>
           </div>
        </div>
      )}

      {/* Uploading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={48} />
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Aura đang nạp nhạc vào bộ nhớ...</p>
          </div>
        </div>
      )}

      <header className="p-4 flex items-center justify-between z-30 bg-opacity-80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg">
              <Music2 size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter">AURA</h1>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className={`p-2 rounded-xl transition-all ${showLibrary ? 'bg-indigo-500/10 text-indigo-400' : 'text-white/40 hover:bg-white/5'}`}>
            <List size={18} />
          </button>
        </div>
        
        <div className="flex-1 max-w-md mx-4 sm:mx-8 hidden sm:block">
          <form onSubmit={(e) => { e.preventDefault(); handleOnlineSearch(); }} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" placeholder="Tìm kiếm âm nhạc trực tuyến..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (onlineResults.length > 0) setOnlineResults([]); }}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-11 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button type="submit" disabled={isSearchingOnline} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 text-[10px] font-black uppercase">
                 {isSearchingOnline ? <RefreshCw size={12} className="animate-spin" /> : "Web"}
              </button>
            )}
          </form>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
           <button onClick={() => setShowSyncModal(true)} className="p-2 text-white/40 hover:text-white" title="Trợ giúp"><HelpCircle size={22} /></button>
           <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-400 hover:text-white bg-indigo-500/10 rounded-xl" title="Thêm nhạc máy"><PlusCircle size={20} /></button>
           <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`glass border-r border-white/5 transition-all duration-500 flex flex-col ${showLibrary ? 'w-full sm:w-80 opacity-100 absolute sm:relative z-40 h-full' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              {onlineResults.length > 0 ? "Kết quả Web" : "Thư viện Aura"}
            </h2>
            {showLibrary && <button onClick={() => setShowLibrary(false)} className="sm:hidden p-2 text-white/40"><X size={18} /></button>}
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide pb-20 sm:pb-4">
            {isSearchingOnline ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/20">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Đang tìm kiếm...</p>
              </div>
            ) : onlineResults.length > 0 ? (
              onlineResults.map((song, i) => (
                <div key={i} onClick={() => handlePlaySong(song)} className="group p-3 rounded-2xl cursor-pointer hover:bg-indigo-500/10 transition-all flex items-center gap-3 border border-transparent hover:border-indigo-500/20">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-white/5">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Play size={16} fill="white" /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate group-hover:text-indigo-400">{song.title}</p>
                    <p className="text-[10px] text-white/30 truncate uppercase font-bold">{song.artist}</p>
                  </div>
                </div>
              ))
            ) : (
              filteredLibrary.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                   <Music2 size={32} className="mx-auto mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Thư viện trống</p>
                </div>
              ) : filteredLibrary.map((song) => (
                <div key={song.id} 
                  onClick={() => {
                    setPlayerState(s => ({ ...s, currentSongIndex: library.findIndex(lb => lb.id === song.id), isPlaying: true, currentTime: 0 }));
                    if (window.innerWidth < 640) setShowLibrary(false);
                  }} 
                  className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${currentSong?.id === song.id ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'} border`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                    {currentSong?.id === song.id && playerState.isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Waves size={16} className="text-indigo-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                    <p className="text-[10px] text-white/30 truncate uppercase font-bold">{song.artist}</p>
                  </div>
                  <button onClick={(e) => handleDeleteSong(song.id, e)} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all text-white/10 sm:opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))
            )}
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
                 <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Bấm (+) để nạp nhạc hoặc dùng AI DJ</p>
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
               {activeTab === 'ai' && <AIDJ onPlaySong={(title, artist) => handlePlaySong({ title, artist } as any)} availableSongs={library} />}
               {activeTab === 'lyrics' && <div className="glass rounded-[2.5rem] sm:rounded-[3.5rem] h-full p-6 sm:p-8"><Lyrics lyrics={currentSong?.lyrics || []} currentTime={playerState.currentTime} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} color={currentSong?.color || '#fff'} /></div>}
               {activeTab === 'story' && (
                 <div className="glass rounded-[2.5rem] sm:rounded-[3.5rem] h-full p-8 sm:p-10 overflow-y-auto scrollbar-hide flex flex-col">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3"><Sparkles className="text-indigo-400" size={20} /> Deep Story</h3>
                    {isStoryLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20"><RefreshCw className="animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest">Generating...</span></div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-sm sm:text-base font-medium leading-relaxed italic text-white/80">"{songStory || 'Aura đang lắng nghe...'}"</p>
                        {insight && (
                          <div className="pt-8 border-t border-white/5">
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] mb-4">Insights</p>
                            <div className="text-xs font-medium leading-loose text-white/40">{insight}</div>
                          </div>
                        )}
                      </div>
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
