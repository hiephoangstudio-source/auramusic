
import React from 'react';
import { Play, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ChartCategory, Song } from '../types';

interface ChartsProps {
  categories: ChartCategory[];
  onPlaySong: (song: Song) => void;
  onPlayAll: (songs: Song[]) => void;
}

const Charts: React.FC<ChartsProps> = ({ categories, onPlaySong, onPlayAll }) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
          Bảng Xếp Hạng
          <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full not-italic font-black tracking-widest text-white shadow-lg shadow-indigo-500/20">TRENDING</span>
        </h2>
        <button className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">Thêm</button>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-8 px-4 scrollbar-hide mask-fade-right">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="w-[300px] sm:w-[340px] shrink-0 rounded-[2.5rem] p-6 flex flex-col gap-5 border border-white/5 shadow-2xl transition-all hover:scale-[1.02]"
            style={{ 
              backgroundColor: category.color,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 group cursor-pointer">
                <h3 className="text-sm font-black uppercase tracking-tighter italic group-hover:text-indigo-400 transition-colors">{category.title}</h3>
                <ChevronRight size={16} className="text-white/20 group-hover:text-indigo-400" />
              </div>
              <button 
                onClick={() => onPlayAll(category.songs)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Phát <Play size={10} fill="currentColor" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {category.songs.map((song, index) => (
                <div 
                  key={song.id} 
                  onClick={() => onPlaySong(song)}
                  className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 cursor-pointer transition-all active:scale-95"
                >
                  <div className="flex flex-col items-center gap-1 w-6">
                    <span className="text-sm font-black italic leading-none">{index + 1}</span>
                    {index === 0 ? <TrendingUp size={10} className="text-indigo-400" /> : 
                     index === 1 ? <TrendingDown size={10} className="text-red-400" /> :
                     <Minus size={10} className="text-white/20" />}
                  </div>

                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-white/5 shrink-0">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black truncate leading-tight group-hover:text-indigo-400 transition-colors uppercase">{song.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] bg-white/5 px-1 rounded text-white/40 font-bold border border-white/5">Lossless</span>
                      <p className="text-[9px] text-white/30 truncate uppercase font-bold tracking-tight">{song.artist}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charts;
