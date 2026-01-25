
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send, ListMusic, Zap, Radio, Play, Save, History, Trash2, X, Key, ExternalLink, Globe, Music2, Search } from 'lucide-react';
import { getMoodRecommendation, searchMusicOnline } from '../services/geminiService';
import { Recommendation, DJSession, Song } from '../types';

interface AIDJProps {
  onPlaySong?: (title: string, artist: string) => void;
  availableSongs?: Song[];
}

const MOOD_PRESETS = [
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'chill', label: 'Chill', emoji: '☕' },
  { id: 'lofi', label: 'Lofi', emoji: '☁️' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
];

const AIDJ: React.FC<AIDJProps> = ({ onPlaySong, availableSongs }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const favs = localStorage.getItem('aura_favorites');
    if (favs) setFavorites(JSON.parse(favs));
  }, []);

  const handleAction = async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorStatus(null);
    setRecommendation(null);

    try {
      const isLikelySearch = inputText.split(' ').length > 1 || inputText.length > 5;
      let result: any;
      if (isLikelySearch) {
        const searchResults = await searchMusicOnline(inputText);
        result = (searchResults && !searchResults.error) ? {
          vibe: `Kết quả tìm kiếm cho "${inputText}"`,
          description: "Tìm thấy từ Internet.",
          suggestedPlaylist: searchResults.tracks,
          sources: searchResults.sources
        } : searchResults;
      } else {
        result = await getMoodRecommendation(inputText, favorites, availableSongs);
      }
      if (result && result.error) setErrorStatus(result.code);
      else setRecommendation(result);
    } catch (err) { setErrorStatus('UNKNOWN_ERROR'); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction(query);
  };

  return (
    <div className="glass p-4 lg:p-8 rounded-[2rem] lg:rounded-[3.5rem] h-full flex flex-col relative overflow-hidden group min-h-0">
      <div className="flex items-center justify-between mb-4 lg:mb-8 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 lg:p-3 bg-indigo-500/20 rounded-xl lg:rounded-2xl">
            <Sparkles className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="text-md lg:text-xl font-black tracking-tight uppercase italic">Aura AI</h2>
            <p className="text-[8px] opacity-30 font-black uppercase tracking-[0.2em]">Smart Search</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        {MOOD_PRESETS.map(p => (
          <button key={p.id} onClick={() => { setQuery(p.label); handleAction(p.label); }} className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white/5 border border-white/10 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2">
            <span>{p.emoji}</span><span>{p.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 shrink-0">
        <div className="relative">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm nhạc..." className="w-full bg-black/20 border border-white/10 rounded-xl lg:rounded-2xl px-4 py-3 lg:px-6 lg:py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-bold" />
          <button type="submit" disabled={isLoading || !query} className="absolute right-1 top-1 lg:right-2 lg:top-2 p-2 lg:p-3 text-indigo-400 hover:text-white transition-all disabled:opacity-50">
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-6">
        {!recommendation && !isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-20 gap-3">
             <Globe size={32} />
             <p className="text-[8px] font-black uppercase tracking-widest">Sẵn sàng</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="glass bg-white/5 border-none rounded-2xl p-4">
              <h3 className="text-sm font-black mb-1 text-indigo-400 italic uppercase">{recommendation.vibe}</h3>
              <p className="text-white/60 text-[10px] leading-relaxed">"{recommendation.description}"</p>
              {recommendation.sources && recommendation.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                  {recommendation.sources.slice(0, 2).map((source: any, idx: number) => (
                    <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded transition-all">
                      <ExternalLink size={8} /> <span className="truncate max-w-[80px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {recommendation.suggestedPlaylist && (
              <div className="space-y-2">
                <div className="grid gap-2">
                  {recommendation.suggestedPlaylist.map((s: any, i: number) => (
                    <div key={i} onClick={() => onPlaySong?.(s.title, s.artist)} className="group flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-indigo-500/10 cursor-pointer transition-all border border-transparent hover:border-indigo-500/20">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-white/5">
                        <img src={s.coverUrl || `https://picsum.photos/seed/${encodeURIComponent(s.title)}/100/100`} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black truncate">{s.title}</p>
                        <p className="text-[8px] text-white/30 uppercase font-black truncate">{s.artist}</p>
                      </div>
                    </div>
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
