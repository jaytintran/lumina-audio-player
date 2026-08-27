import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  X,
  Layers,
} from 'lucide-react';
import { useMultiDeckStore } from '../../stores/multiDeckStore';
import { CoverArt } from '../common/CoverArt';

export const MultiDeckTabBar: React.FC = () => {
  const {
    decks,
    activeDeckId,
    setActiveDeck,
    togglePlayDeck,
    toggleMuteDeck,
    toggleDeckLoop,
    setDeckVolume,
    removeDeck,
    clearAllDecks,
    pauseAllDecks,
    playAllDecks,
  } = useMultiDeckStore();

  if (decks.length === 0) return null;

  const hasAnyPlaying = decks.some((d) => d.isPlaying);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pointer-events-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Deck Tabs Container */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 pr-2 no-scrollbar">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090d12]/95 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0 shadow-lg">
            <Layers className="w-3.5 h-3.5" />
            <span>Audio Layers ({decks.length})</span>
          </div>

          {/* Active Audio Channel Tabs */}
          {decks.map((deck) => {
            const isActive = activeDeckId === deck.id;
            return (
              <div
                key={deck.id}
                onClick={() => setActiveDeck(deck.id)}
                className={`group flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl border transition-all cursor-pointer select-none shrink-0 shadow-lg ${
                  isActive
                    ? 'bg-[#0f241a] border-emerald-500 text-slate-100 ring-1 ring-emerald-500/50'
                    : 'bg-[#0a0f15]/95 border-[#17232e] text-slate-400 hover:text-slate-200 hover:border-[#273747]'
                }`}
              >
                {/* Mini Cover Art */}
                <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-[#17232e]">
                  <CoverArt coverKey={deck.track.coverKey} title={deck.track.title} size="sm" />
                </div>

                {/* Track Title */}
                <div className="flex flex-col min-w-0 max-w-[110px] sm:max-w-[140px]">
                  <span className="text-[11px] font-semibold truncate leading-tight">
                    {deck.track.title}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                    {deck.track.artist}
                  </span>
                </div>

                {/* Individual Deck Play/Pause */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayDeck(deck.id);
                  }}
                  className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title={deck.isPlaying ? 'Pause this layer' : 'Play this layer'}
                >
                  {deck.isPlaying ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  )}
                </button>

                {/* Individual Deck Mute Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMuteDeck(deck.id);
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    deck.isMuted
                      ? 'text-rose-400 bg-rose-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  }`}
                  title={deck.isMuted ? 'Unmute layer' : 'Mute layer'}
                >
                  {deck.isMuted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>

                {/* Individual Deck Loop Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDeckLoop(deck.id);
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    deck.isLooping
                      ? 'text-cyan-400 bg-cyan-950/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={deck.isLooping ? 'Looping enabled' : 'Click to loop'}
                >
                  <Repeat className="w-3 h-3" />
                </button>

                {/* Mini Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={deck.isMuted ? 0 : deck.volume}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    setDeckVolume(deck.id, parseFloat(e.target.value));
                  }}
                  className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  title={`Volume: ${Math.round(deck.volume * 100)}%`}
                />

                {/* Close / Cancel Channel */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDeck(deck.id);
                  }}
                  className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                  title="Close audio layer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Master Multi-Deck Actions */}
        <div className="flex items-center gap-1.5 bg-[#090d12]/95 border border-[#17232e] rounded-2xl p-1 shadow-xl shrink-0">
          <button
            onClick={hasAnyPlaying ? pauseAllDecks : playAllDecks}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[11px] font-semibold transition-colors"
          >
            {hasAnyPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause All</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Play All</span>
              </>
            )}
          </button>

          <button
            onClick={clearAllDecks}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-[11px]"
            title="Close all audio layers"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
