
import React, { useState, useEffect } from 'react';
// Added Search to imports from lucide-react
import { Sparkles, Loader2, Send, ListMusic, Zap, Radio, Play, Save, History, Trash2, X, Key, ExternalLink, Globe, Music2, Search } from 'lucide-react';
import { getMoodRecommendation, searchMusicOnline } from '../services/geminiService';
import { Recommendation, DJSession, Song } from '../types';

const MOOD_PRESETS = [
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'chill', label: 'Chill', emoji: '☕' },
  { id: 'lofi', label: 'Lofi', emoji: '☁️' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
];

interface AIDJProps {
  onPlaySong?: (title: string, artist: string) => void;
  availableSongs?: Song[];
}

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
      // Logic: Nếu query có độ dài trung bình và không giống "mood", ưu tiên searchMusicOnline
      const isLikelySearch = inputText.split(' ').length > 1 || inputText.length > 5;
      
      let result: any;
      if (isLikelySearch) {
        // Thực hiện tìm kiếm bài hát trực tiếp
        const searchResults = await searchMusicOnline(inputText);
        if (searchResults && !searchResults.error) {
          result = {
            vibe: `Kết quả tìm kiếm cho "${inputText}"`,
            description: "Aura đã tìm thấy các bản nhạc phù hợp nhất từ Internet.",
            suggestedPlaylist: searchResults.tracks,
            sources: searchResults.sources // Include grounding sources
          };
        } else {
          result = searchResults; // Handle error
        }
      } else {
        // Thực hiện gợi ý theo mood
        result = await getMoodRecommendation(inputText, favorites, availableSongs);
      }

      if (result && result.error) {
        setErrorStatus(result.code);
      } else {
        setRecommendation(result);
      }
    } catch (err) {
      setErrorStatus('UNKNOWN_ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction(query);
  };

  return (
    <div className="glass p-8 rounded-[3.5rem] h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
        <Sparkles size={120} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-2xl">
            <Sparkles className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase italic">Aura AI Search</h2>
            <p className="text-[10px] opacity-30 font-black uppercase tracking-[0.3em]">Smart Cloud Integration</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        {MOOD_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => { setQuery(p.label); handleAction(p.label); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2"
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ hoặc tâm trạng..."
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20 text-sm font-bold"
          />
          <button
            type="submit"
            disabled={isLoading || !query}
            className="absolute right-2 top-2 p-3 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
          </button>
        </div>
      </form>

      {errorStatus === 'QUOTA_EXCEEDED' && (
        <div className="mb-6 p-6 glass border-red-500/20 bg-red-500/5 rounded-3xl">
          <p className="text-red-400 text-[10px] font-black uppercase mb-4 tracking-widest">Giới hạn API đã hết. Hãy chọn API Key cá nhân.</p>
          <button onClick={async () => (window as any).aistudio?.openSelectKey()} className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest">
            Cài đặt API Key
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide relative z-10 pb-10">
        {!recommendation && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 opacity-20">
             <div className="p-8 glass rounded-full"><Globe size={40} strokeWidth={1} /></div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sẵn sàng tìm kiếm trên Web</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="glass bg-white/5 border-none rounded-3xl p-6">
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight italic text-indigo-400">{recommendation.vibe}</h3>
              <p className="text-white/60 text-xs leading-relaxed font-medium">"{recommendation.description}"</p>
              
              {/* Display Grounding Sources as required by Gemini API guidelines */}
              {recommendation.sources && recommendation.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">Nguồn tin cậy:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.sources.map((source: any, idx: number) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-md transition-all border border-indigo-500/10 hover:border-indigo-500/30"
                      >
                        <ExternalLink size={10} />
                        <span className="truncate max-w-[120px]">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {recommendation.suggestedPlaylist && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest mb-2 px-2 text-white/30">Kết quả khả dụng</p>
                <div className="grid gap-2">
                  {recommendation.suggestedPlaylist.map((s: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => onPlaySong?.(s.title, s.artist)}
                      className="group flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shrink-0 relative bg-white/5">
                        <img 
                          src={s.coverUrl || `https://picsum.photos/seed/${encodeURIComponent(s.title)}/200/200`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          alt="" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={20} className="text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate text-white">{s.title}</p>
                        <p className="text-[9px] text-white/30 uppercase font-black truncate tracking-wider">{s.artist}</p>
                      </div>
                      <div className="shrink-0 text-white/10 group-hover:text-indigo-400 transition-colors pr-2">
                        <Music2 size={16} />
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
