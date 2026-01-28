
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Play, Globe, Music2, Search, ExternalLink } from 'lucide-react';
import { getMoodRecommendation, searchMusicOnline } from '../services/geminiService';
import { Song } from '../types';

interface AIDJProps {
  onPlaySong?: (title: string, artist: string) => void;
  availableSongs?: Song[];
}

const MOOD_PRESETS = [
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'chill', label: 'Chill', emoji: '☕' },
  { id: 'lofi', label: 'Lofi', emoji: '☁️' },
];

const AIDJ: React.FC<AIDJProps> = ({ onPlaySong, availableSongs }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

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
          vibe: `Kết quả cho "${inputText}"`,
          description: "Tìm thấy từ Web.",
          suggestedPlaylist: searchResults.tracks,
          sources: searchResults.sources
        } : searchResults;
      } else {
        result = await getMoodRecommendation(inputText, [], availableSongs);
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
    <div className="h-full flex flex-col p-4 lg:p-6 min-h-0">
      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        {MOOD_PRESETS.map(p => (
          <button 
            key={p.id} 
            onClick={() => { setQuery(p.label); handleAction(p.label); }} 
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2"
          >
            <span>{p.emoji}</span><span>{p.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 shrink-0">
        <div className="relative">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Tìm nhạc hoặc cảm xúc..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-bold" 
          />
          <button type="submit" disabled={isLoading || !query} className="absolute right-2 top-2 p-2.5 text-indigo-400 hover:text-white transition-all disabled:opacity-50">
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-4">
        {!recommendation && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-20 gap-3">
             <Globe size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest">Web Search Active</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h3 className="text-sm font-black mb-1 text-indigo-400 italic uppercase">{recommendation.vibe}</h3>
              <p className="text-white/60 text-[11px] leading-relaxed">"{recommendation.description}"</p>
            </div>

            {recommendation.suggestedPlaylist && (
              <div className="space-y-2">
                <div className="grid gap-2">
                  {recommendation.suggestedPlaylist.map((s: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => onPlaySong?.(s.title, s.artist)} 
                      className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-indigo-500/10 cursor-pointer transition-all border border-transparent hover:border-indigo-500/20"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-white/10">
                        <img 
                          src={s.coverUrl || `https://picsum.photos/seed/${encodeURIComponent(s.title)}/100/100`} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black truncate">{s.title}</p>
                        <p className="text-[9px] text-white/30 uppercase font-black truncate">{s.artist}</p>
                      </div>
                      <Music2 size={14} className="text-white/10 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {recommendation.sources && recommendation.sources.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {recommendation.sources.slice(0, 3).map((source: any, idx: number) => (
                  <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-400/60 hover:text-indigo-400 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg transition-all border border-white/5">
                    <ExternalLink size={10} /> <span className="truncate max-w-[100px]">{source.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDJ;
