
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Search, Waves, List, RefreshCw, Upload, Trash2, Globe, ExternalLink, Sparkles, X, Loader2, AlertCircle, Key, Music2, Download, Copy, Check, Info, FileJson, Share, PlusCircle, HelpCircle, FolderHeart, ChevronLeft, Settings2, MoreVertical, ArrowUpDown, SortAsc, SortDesc
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
  
  const [viewingPlaylistId, setViewingPlaylistId] = useState<string | null>(null);
  const [activeQueueIds, setActiveQueueIds] = useState<string[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'lyrics' | 'story'>('ai');
  const [showLibrary, setShowLibrary] = useState(true);
  const [showPlaylistStudio, setShowPlaylistStudio] = useState(false);
  const [songStoryData, setSongStoryData] = useState<{text: string, sources: any[]} | null>(null);
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

  const currentQueueSongs = useMemo(() => activeQueueIds.map(id => library.find(s => s.id === id)).filter(Boolean) as Song[], [activeQueueIds, library]);
  const currentSong = useMemo(() => currentQueueSongs.length === 0 ? null : currentQueueSongs[playerState.currentSongIndex] || currentQueueSongs[0], [playerState.currentSongIndex, currentQueueSongs]);

  // Fetch song story when tab becomes active or song changes
  useEffect(() => {
    if (currentSong && activeTab === 'story') {
      const fetchStory = async () => {
        setIsStoryLoading(true);
        const data = await getSongStory(currentSong.title, currentSong.artist);
        if (data && !data.error) {
          setSongStoryData(data);
        } else {
          setSongStoryData({ text: "Giai điệu này kể câu chuyện của riêng nó.", sources: [] });
        }
        setIsStoryLoading(false);
      };
      fetchStory();
    }
  }, [currentSong?.id, activeTab]);

  const handleCreatePlaylist = (name: string) => setPlaylists([...playlists, { id: `pl-${Date.now()}`, name, songIds: [] }]);
  const handleAddToPlaylist = (playlistId: string, songId: string) => setPlaylists(prev => prev.map(pl => (pl.id === playlistId && !pl.songIds.includes(songId)) ? { ...pl, songIds: [...pl.songIds, songId] } : pl));
  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, songIds: pl.songIds.filter(id => id !== songId) } : pl));
  
  const handleReorderPlaylist = (playlistId: string, newSongIds: string[]) => {
    setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, songIds: newSongIds } : pl));
    if (viewingPlaylistId === playlistId) setActiveQueueIds(newSongIds);
  };

  const handleQuickSort = (playlistId: string, type: 'title' | 'artist') => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const sortedIds = [...pl.songIds].sort((a, b) => {
      const sA = library.find(s => s.id === a);
      const sB = library.find(s => s.id === b);
      if (!sA || !sB) return 0;
      return type === 'title' 
        ? sA.title.localeCompare(sB.title, undefined, { numeric: true, sensitivity: 'base' })
        : sA.artist.localeCompare(sB.artist, undefined, { numeric: true, sensitivity: 'base' });
    });
    handleReorderPlaylist(playlistId, sortedIds);
    if ('vibrate' in navigator) navigator.vibrate(20);
  };

  const startPlayingQueue = (ids: string[], startIndex: number) => {
    setActiveQueueIds(ids);
    setPlayerState(s => ({ ...s, currentSongIndex: startIndex, isPlaying: true, currentTime: 0 }));
    if (window.innerWidth < 768) setShowLibrary(false);
  };

  // Hàm xử lý phát nhạc từ kết quả AI Search
  const handlePlayAISong = async (title: string, artist: string) => {
    // 1. Tìm trong thư viện hiện tại
    const existing = library.find(s => 
      s.title.toLowerCase().includes(title.toLowerCase()) && 
      s.artist.toLowerCase().includes(artist.toLowerCase())
    );

    if (existing) {
      const idxInQueue = activeQueueIds.indexOf(existing.id);
      if (idxInQueue !== -1) {
        setPlayerState(s => ({ ...s, currentSongIndex: idxInQueue, isPlaying: true }));
      } else {
        const newQueue = [...activeQueueIds, existing.id];
        setActiveQueueIds(newQueue);
        setPlayerState(s => ({ ...s, currentSongIndex: newQueue.length - 1, isPlaying: true }));
      }
    } else {
      // 2. Tạo bản nhạc ảo nếu không có trong thư viện
      const virtualId = `online-${Date.now()}`;
      const virtualSong: Song = {
        id: virtualId,
        title,
        artist,
        album: 'Aura Cloud Search',
        coverUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/400/400`,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', // Placeholder audio cho kết quả tìm kiếm
        duration: 0,
        color: '#6366f1'
      };
      
      const newLib = [...library, virtualSong];
      setLibrary(newLib);
      const newQueue = [...activeQueueIds, virtualId];
      setActiveQueueIds(newQueue);
      setPlayerState(s => ({ ...s, currentSongIndex: newQueue.length - 1, isPlaying: true }));
      
      // Thông báo cho người dùng
      if ('vibrate' in navigator) navigator.vibrate(50);
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
    } else audioRef.current.pause();
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
        id, title: file.name.replace(/\.[^/.]+$/, ""), artist: "Ngoại tuyến", album: "Thiết bị",
        coverUrl: `https://picsum.photos/seed/${id}/400/400`, audioUrl: URL.createObjectURL(file),
        duration: 0, color: "#a855f7"
      });
    }
    const nextLib = [...library, ...newSongs];
    setLibrary(nextLib);
    await saveLibraryMetadata(nextLib);
    setIsUploading(false);
  };

  const renderSidebarContent = () => {
    if (viewingPlaylistId === null) {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-6 pb-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Thư viện của bạn</h2>
            <div onClick={() => setViewingPlaylistId('all')} className="group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 bg-white/5 border border-white/5 hover:border-white/10 mb-6">
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
          <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-2">
            {playlists.map(pl => (
              <div key={pl.id} onClick={() => setViewingPlaylistId(pl.id)} className="group p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 hover:bg-white/5 border border-transparent hover:border-white/5">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all border border-white/5"><FolderHeart className="text-white/20 group-hover:text-indigo-400" size={20} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate uppercase tracking-tighter">{pl.name}</p>
                  <p className="text-[8px] text-white/30 font-black uppercase tracking-widest">{pl.songIds.length} bài hát</p>
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
      <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-300">
        <div className="p-6 flex flex-col gap-4">
          <button onClick={() => setViewingPlaylistId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"><ChevronLeft size={14} /> Quay lại</button>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black truncate uppercase tracking-tighter italic">{isAll ? "Tất cả bài hát" : targetPlaylist?.name}</h2>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">{displaySongs.length} bài hát</p>
            </div>
            {!isAll && (
              <div className="flex gap-1">
                <button onClick={() => handleQuickSort(viewingPlaylistId!, 'title')} title="Sắp xếp tự nhiên (1, 2, 10...)" className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-indigo-400 transition-all"><SortAsc size={16} /></button>
                <button onClick={() => setShowPlaylistStudio(true)} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><Settings2 size={16} /></button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-10 space-y-1">
          {displaySongs.map((song, idx) => (
            <div key={song.id} onClick={() => startPlayingQueue(songListIds, idx)} className={`group p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${currentSong?.id === song.id && activeQueueIds.length === songListIds.length ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'}`}>
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
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${playerState.theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-100 text-black'} font-sans select-none overflow-hidden relative pb-safe`}>
      {currentSong && <audio ref={audioRef} src={currentSong.audioUrl} crossOrigin="anonymous" onTimeUpdate={() => audioRef.current && setPlayerState(s => ({ ...s, currentTime: audioRef.current!.currentTime }))} onEnded={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % currentQueueSongs.length }))} />}
      {showPlaylistStudio && <PlaylistManager playlists={playlists} songs={library} onCreatePlaylist={handleCreatePlaylist} onDeletePlaylist={(id) => { setPlaylists(playlists.filter(p => p.id !== id)); if (viewingPlaylistId === id) setViewingPlaylistId(null); }} onAddToPlaylist={handleAddToPlaylist} onRemoveFromPlaylist={handleRemoveFromPlaylist} onReorderPlaylist={handleReorderPlaylist} onSelectPlaylist={(pl) => { setViewingPlaylistId(pl.id); startPlayingQueue(pl.songIds, 0); setShowPlaylistStudio(false); }} onClose={() => setShowPlaylistStudio(false)} />}
      <header className="p-4 flex items-center justify-between z-30 bg-opacity-80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg"><Music2 size={18} className="text-white" /></div><h1 className="text-lg font-black tracking-tighter">AURA</h1></div>
          <button onClick={() => setShowLibrary(!showLibrary)} className={`p-2 rounded-xl transition-all ${showLibrary ? 'bg-indigo-500/10 text-indigo-400' : 'text-white/40 hover:bg-white/5'}`}><List size={18} /></button>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowHelpModal(true)} className="p-2 text-white/20 hover:text-white"><HelpCircle size={20} /></button>
           <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"><PlusCircle size={20} /></button>
           <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`glass border-r border-white/5 transition-all duration-500 flex flex-col ${showLibrary ? 'w-full sm:w-80 opacity-100 absolute sm:relative z-40 h-full' : 'w-0 opacity-0 overflow-hidden'}`}>{renderSidebarContent()}</aside>
        <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 overflow-y-auto sm:overflow-hidden scrollbar-hide">
          <div className="flex-1 glass rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 flex flex-col relative overflow-hidden min-h-[500px]">
             {currentSong ? (
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60 mb-1 block">Aura Playing</span><h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-0.5 truncate uppercase italic">{currentSong.title}</h2><p className="text-sm text-white/40 font-bold uppercase tracking-widest truncate">{currentSong.artist}</p></div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center py-10">
                    <div className="w-48 h-48 sm:w-72 sm:h-72 rounded-[4rem] overflow-hidden shadow-2xl relative z-10 group"><img src={currentSong.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" /><div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay"></div></div>
                    <div className="w-full max-w-xl mt-12 hidden sm:block"><Visualizer analyser={analyser} color={currentSong.color} type="bars" /></div>
                  </div>
                  <div className="flex items-center justify-center gap-8 sm:gap-12 mt-auto pt-6">
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex - 1 + currentQueueSongs.length) % currentQueueSongs.length }))} className="text-white/20 hover:text-white transition-colors"><SkipBack size={32} fill="currentColor" /></button>
                    <button onClick={() => setPlayerState(s => ({ ...s, isPlaying: !s.isPlaying }))} className="w-20 h-20 rounded-[2.5rem] bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20">{playerState.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}</button>
                    <button onClick={() => setPlayerState(s => ({ ...s, currentSongIndex: (s.currentSongIndex + 1) % currentQueueSongs.length }))} className="text-white/20 hover:text-white transition-colors"><SkipForward size={32} fill="currentColor" /></button>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-20 text-center py-20">
                 <div className="p-10 rounded-full border border-white/5 bg-white/5 mb-6"><Music2 size={80} strokeWidth={1} /></div>
                 <h2 className="text-xl font-black uppercase tracking-[0.4em] italic">Aura Assistant</h2>
                 <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-2">Chọn nhạc để bắt đầu</p>
               </div>
             )}
          </div>
          <div className="w-full lg:w-[400px] flex flex-col gap-6">
            <div className="glass rounded-2xl p-1.5 flex bg-white/5 shrink-0">
               {(['ai', 'lyrics', 'story'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-white/40 hover:text-white/60'}`}>{tab === 'ai' ? 'Trợ lý' : tab === 'lyrics' ? 'Lời bài hát' : 'Câu chuyện'}</button>)}
            </div>
            <div className="flex-1 min-h-[400px]">
               {activeTab === 'ai' && <AIDJ onPlaySong={handlePlayAISong} availableSongs={library} />}
               {activeTab === 'lyrics' && <div className="glass rounded-[3rem] h-full p-8"><Lyrics lyrics={currentSong?.lyrics || []} currentTime={playerState.currentTime} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} color={currentSong?.color || '#fff'} /></div>}
               {activeTab === 'story' && (
                 <div className="glass rounded-[3rem] h-full p-10 overflow-y-auto flex flex-col">
                   <h3 className="text-lg font-black mb-8 flex items-center gap-3"><Sparkles className="text-indigo-400" size={20} /> Deep Insights</h3>
                   <div className="space-y-6">
                     {isStoryLoading ? (
                       <div className="flex flex-col items-center justify-center py-10 opacity-40 gap-4">
                         <Loader2 className="animate-spin text-indigo-400" size={32} />
                         <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aura đang cảm nhận...</p>
                       </div>
                     ) : (
                       <>
                         <p className="text-base font-medium leading-relaxed italic text-white/80">
                           "{songStoryData?.text || 'Chọn một bài hát để nghe câu chuyện của nó.'}"
                         </p>
                         
                         {/* Display Grounding Sources for Story as required by guidelines */}
                         {songStoryData?.sources && songStoryData.sources.length > 0 && (
                           <div className="mt-8 pt-8 border-t border-white/5">
                             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Tìm hiểu thêm:</p>
                             <div className="space-y-3">
                               {songStoryData.sources.map((source: any, idx: number) => (
                                 <a 
                                   key={idx} 
                                   href={source.uri} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="flex items-center gap-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors group"
                                 >
                                   <ExternalLink size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
                                   <span className="truncate">{source.title}</span>
                                 </a>
                               ))}
                             </div>
                           </div>
                         )}
                       </>
                     )}
                   </div>
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
