
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, ListMusic, Zap, Radio, Play, Save, History, Trash2, X, Key } from 'lucide-react';
import { getMoodRecommendation } from '../services/geminiService';
import { Recommendation, DJSession, Song } from '../types';

const MOOD_PRESETS = [
  { id: 'chill', label: 'Chill', emoji: '☕' },
  { id: 'workout', label: 'Workout', emoji: '⚡' },
  { id: 'focus', label: 'Focus', emoji: '🧠' },
  { id: 'party', label: 'Party', emoji: '🎉' },
];

const VERSION_REQUESTS = ['Remix', 'Live', 'Acoustic', 'Radio'];

interface AIDJProps {
  onPlaySong?: (title: string, artist: string) => void;
  availableSongs?: Song[];
}

const AIDJ: React.FC<AIDJProps> = ({ onPlaySong, availableSongs }) => {
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedSessions, setSavedSessions] = useState<DJSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastVersionRequest, setLastVersionRequest] = useState<string | null>(null);

  useEffect(() => {
    const favs = localStorage.getItem('aura_favorites');
    if (favs) setFavorites(JSON.parse(favs));
    
    const sessions = localStorage.getItem('aura_dj_sessions');
    if (sessions) setSavedSessions(JSON.parse(sessions));
  }, []);

  const handleFetch = async (query: string, version?: string) => {
    setIsLoading(true);
    setErrorStatus(null);
    setLastVersionRequest(version || null);
    
    const result = await getMoodRecommendation(query, favorites, version, availableSongs);
    
    if (result && 'error' in result) {
      setErrorStatus(result.code);
      setRecommendation(null);
    } else {
      setRecommendation(result as Recommendation);
    }
    setIsLoading(false);
  };

  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Sau khi chọn key, thử lại yêu cầu
      if (mood) handleFetch(mood, lastVersionRequest || undefined);
    } else {
      alert("Tính năng chọn Key chỉ khả dụng trong môi trường AI Studio.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood.trim()) return;
    handleFetch(mood);
  };

  return (
    <div className="glass p-8 rounded-[3.5rem] h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <Sparkles size={120} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-2xl">
            <Sparkles className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase">Trợ lý AI DJ</h2>
            <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest">Personal Vibe Engine</p>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-indigo-500 text-white' : 'hover:bg-white/10 opacity-40 hover:opacity-100'}`}
        >
          <History size={20} />
        </button>
      </div>

      {!showHistory ? (
        <>
          <div className="flex flex-wrap gap-2 mb-6 relative z-10">
            {MOOD_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => { setMood(p.label); handleFetch(p.label); }}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mb-6 relative z-10">
            <div className="relative">
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Mood của bạn là gì?"
                className="w-full bg-black/10 border border-white/10 rounded-[2rem] px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20 text-sm font-medium"
              />
              <button
                type="submit"
                disabled={isLoading || !mood}
                className="absolute right-2 top-2 p-3 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-full transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </div>
          </form>

          {/* Error Message for Quota */}
          {errorStatus === 'QUOTA_EXCEEDED' && (
            <div className="mb-6 p-6 glass border-red-500/20 bg-red-500/5 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
              <p className="text-red-400 text-xs font-bold mb-4">Hệ thống đang quá tải hạn mức API.</p>
              <button 
                onClick={handleOpenKeySelection}
                className="w-full py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Key size={14} />
                Sử dụng API Key cá nhân
              </button>
              <p className="text-[8px] text-white/30 mt-3 text-center uppercase tracking-widest leading-relaxed">
                Bạn cần chọn một API Key từ dự án có trả phí (Paid Project) để vượt qua giới hạn này.
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide relative z-10">
            {!recommendation && !isLoading && !errorStatus && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                 <div className="p-6 glass rounded-full opacity-20"><Radio size={48} strokeWidth={1} /></div>
                 <p className="text-white/40 text-sm italic font-medium">"Tôi có thể tạo playlist, tìm bản Remix hoặc Live phù hợp với bạn..."</p>
              </div>
            )}

            {recommendation && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="glass bg-white/5 border-none rounded-[2.5rem] p-6 relative group/card">
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Analysis Result</p>
                  <h3 className="text-2xl font-black mb-3 leading-tight">{recommendation.vibe}</h3>
                  <p className="text-white/60 text-sm leading-relaxed italic font-medium">
                    "{recommendation.description}"
                  </p>
                </div>

                {recommendation.suggestedPlaylist && (
                  <div className="glass bg-white/5 border-none rounded-[2.5rem] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ListMusic size={18} className="text-indigo-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Playlist đề xuất</p>
                    </div>
                    <div className="space-y-4">
                      {recommendation.suggestedPlaylist.map((s, i) => (
                        <div 
                          key={i} 
                          onClick={() => onPlaySong?.(s.title, s.artist)}
                          className="flex flex-col border-l-4 border-indigo-500/20 pl-4 py-1 hover:border-indigo-500 transition-all cursor-pointer group/playlist"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-black group-hover/playlist:text-indigo-400 transition-colors">{s.title}</span>
                            <Play size={10} className="opacity-0 group-hover/playlist:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider">{s.artist}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide relative z-10">
          {/* History view remains the same */}
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Sessions đã lưu</h3>
          </div>
          {savedSessions.map(session => (
            <div key={session.id} className="p-4 glass rounded-3xl mb-2">
              <p className="text-sm font-black">{session.name}</p>
              <p className="text-[10px] opacity-40">{session.recommendation.vibe}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIDJ;
