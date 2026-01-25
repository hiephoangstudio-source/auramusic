
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, ListMusic, Zap, Radio, Play, Save, History, Trash2, X, Key, ExternalLink, Globe } from 'lucide-react';
import { getMoodRecommendation } from '../services/geminiService';
import { Recommendation, DJSession, Song } from '../types';

const MOOD_PRESETS = [
  { id: 'trending', label: 'Trending Now', emoji: '🔥' },
  { id: 'chill', label: 'Chill', emoji: '☕' },
  { id: 'workout', label: 'Workout', emoji: '⚡' },
  { id: 'focus', label: 'Focus', emoji: '🧠' },
];

interface AIDJProps {
  onPlaySong?: (title: string, artist: string) => void;
  availableSongs?: Song[];
}

const AIDJ: React.FC<AIDJProps> = ({ onPlaySong, availableSongs }) => {
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<(Recommendation & { sources?: any[] }) | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const favs = localStorage.getItem('aura_favorites');
    if (favs) setFavorites(JSON.parse(favs));
  }, []);

  const handleFetch = async (query: string) => {
    setIsLoading(true);
    setErrorStatus(null);
    
    // Fix: Pass query, favorites, and availableSongs (3 arguments) to getMoodRecommendation.
    // Cast to any to handle potential error objects returned by the service.
    const result: any = await getMoodRecommendation(query, favorites, availableSongs);
    
    // Fix: Check for 'error' property on the result object to handle quota or other API errors safely.
    if (result && result.error) {
      setErrorStatus(result.code);
      setRecommendation(null);
    } else {
      setRecommendation(result as (Recommendation & { sources?: any[] }));
    }
    setIsLoading(false);
  };

  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      if (mood) handleFetch(mood);
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
            <h2 className="text-xl font-black tracking-tight uppercase">AI DJ Assistant</h2>
            <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest">Web-Connected Search</p>
          </div>
        </div>
      </div>

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
            placeholder="Mood hoặc Tên bài hát bạn muốn tìm?"
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

      {errorStatus === 'QUOTA_EXCEEDED' && (
        <div className="mb-6 p-6 glass border-red-500/20 bg-red-500/5 rounded-[2rem]">
          <p className="text-red-400 text-xs font-bold mb-4">Quota Exceeded. Please select your own API Key.</p>
          <button onClick={handleOpenKeySelection} className="w-full py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest">
            Sử dụng API Key cá nhân
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide relative z-10">
        {!recommendation && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
             <div className="p-6 glass rounded-full opacity-20"><Globe size={48} strokeWidth={1} /></div>
             <p className="text-white/40 text-sm italic font-medium">"Tôi sẽ tìm kiếm trên Web những bản nhạc phù hợp nhất cho bạn..."</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6">
            <div className="glass bg-white/5 border-none rounded-[2.5rem] p-6">
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">AI Analysis & Web Search</p>
              <h3 className="text-2xl font-black mb-3 leading-tight">{recommendation.vibe}</h3>
              <p className="text-white/60 text-sm leading-relaxed italic font-medium">"{recommendation.description}"</p>
            </div>

            {recommendation.suggestedPlaylist && (
              <div className="glass bg-white/5 border-none rounded-[2.5rem] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Kết quả tìm kiếm nhạc</p>
                <div className="space-y-4">
                  {recommendation.suggestedPlaylist.map((s, i) => (
                    <div 
                      key={i} 
                      className="flex flex-col border-l-4 border-indigo-500/20 pl-4 py-1 hover:border-indigo-500 transition-all cursor-pointer group"
                      onClick={() => onPlaySong?.(s.title, s.artist)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black group-hover:text-indigo-400">{s.title}</span>
                        <Play size={10} className="opacity-0 group-hover:opacity-100" />
                      </div>
                      <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider">{s.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendation.sources && recommendation.sources.length > 0 && (
              <div className="px-4">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-30">Nguồn tham khảo (Google Search)</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-bold text-white/60 transition-all"
                    >
                      <ExternalLink size={10} />
                      <span className="truncate max-w-[120px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDJ;
