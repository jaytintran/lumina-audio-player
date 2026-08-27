import React, { useMemo, useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

interface LyricsViewerProps {
  lyrics?: string;
  className?: string;
}

interface LyricLine {
  time: number; // in seconds
  text: string;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ lyrics, className = '' }) => {
  const { currentTime, seek } = usePlayerStore();
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse LRC formatted lyrics
  const parsedLyrics = useMemo<LyricLine[] | null>(() => {
    if (!lyrics) return null;

    const lines = lyrics.split('\n');
    const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    const parsed: LyricLine[] = [];

    for (const line of lines) {
      const match = line.match(lrcRegex);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        const time = mins * 60 + secs + ms / (match[3].length === 3 ? 1000 : 100);
        parsed.push({ time, text: match[4].trim() });
      }
    }

    if (parsed.length > 0) {
      return parsed.sort((a, b) => a.time - b.time);
    }

    return null;
  }, [lyrics]);

  // Find active line index
  const activeIndex = useMemo(() => {
    if (!parsedLyrics) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].time <= currentTime) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, currentTime]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!lyrics || lyrics.trim() === '') {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-8 text-zinc-500 ${className}`}>
        <p className="text-sm font-medium">No lyrics available for this track</p>
        <p className="text-xs text-zinc-600 mt-1">LRC synced lyrics will highlight automatically when present in ID3 tags</p>
      </div>
    );
  }

  // If parsed LRC
  if (parsedLyrics) {
    return (
      <div
        ref={containerRef}
        className={`overflow-y-auto px-4 py-8 space-y-6 text-center select-none ${className}`}
      >
        {parsedLyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : null}
              onClick={() => seek(line.time)}
              className={`cursor-pointer transition-all duration-300 transform px-4 py-1.5 rounded-xl ${
                isActive
                  ? 'text-cyan-300 font-bold text-xl md:text-2xl scale-105 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] bg-cyan-500/10'
                  : isPassed
                  ? 'text-zinc-500 font-medium text-base md:text-lg opacity-70 hover:text-zinc-300'
                  : 'text-zinc-400 font-medium text-base md:text-lg opacity-85 hover:text-zinc-200'
              }`}
            >
              {line.text || '♪ ♪ ♪'}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback plain text
  return (
    <div className={`overflow-y-auto px-6 py-6 text-center whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 ${className}`}>
      {lyrics}
    </div>
  );
};
