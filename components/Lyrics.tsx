
import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../types';

interface LyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  color: string;
}

const Lyrics: React.FC<LyricsProps> = ({ lyrics, currentTime, onSeek, color }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = lyrics.reduce((acc, line, index) => {
    return currentTime >= line.time ? index : acc;
  }, 0);

  const lastIndexRef = useRef<number>(activeIndex);

  useEffect(() => {
    if (activeIndex !== lastIndexRef.current) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10); // Rung nhẹ khi chuyển dòng
      }
      lastIndexRef.current = activeIndex;
    }

    const activeElement = containerRef.current?.children[activeIndex] as HTMLElement;
    if (activeElement && containerRef.current) {
      containerRef.current.scrollTo({
        top: activeElement.offsetTop - containerRef.current.offsetHeight / 2 + activeElement.offsetHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [activeIndex, lyrics.length]);

  if (!lyrics.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <p className="text-sm italic">Giai điệu này không lời...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto space-y-10 py-32 px-4 scrollbar-hide mask-gradient"
      style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
      }}
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        return (
          <p
            key={index}
            onClick={() => onSeek(line.time)}
            className={`text-2xl lg:text-4xl font-bold transition-all duration-700 cursor-pointer transform ${
              isActive 
                ? 'opacity-100 scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                : 'opacity-10 hover:opacity-30 scale-100'
            }`}
            style={{ 
              color: isActive ? color : 'white',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
};

export default Lyrics;
