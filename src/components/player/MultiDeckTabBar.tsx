import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  X,
} from 'lucide-react';
import { useMultiDeckStore } from '../../stores/multiDeckStore';
import { usePlayerStore } from '../../stores/playerStore';
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
    swapWithMainTrack,
  } = useMultiDeckStore();

  const { currentTrack, playTrack } = usePlayerStore();

  if (decks.length === 0) return null;

  const hasAnyPlaying = decks.some((d) => d.isPlaying);

  const handleTabClick = async (deckId: string) => {
    setActiveDeck(deckId);
    const selectedTrack = await swapWithMainTrack(deckId, currentTrack);
    if (selectedTrack) {
      playTrack(selectedTrack);
    }
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pointer-events-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Deck Tabs Container */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 pr-2 no-scrollbar">
          {/* Active Audio Channel Tabs */}
          {decks.map((deck) => {
            const isActive = activeDeckId === deck.id;
            return (
              <div
                key={deck.id}
                onClick={() => handleTabClick(deck.id)}
                title="Click to switch with main player"
                className={`group flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl border transition-all cursor-pointer select-none shrink-0 shadow-lg ${
                  isActive
                    ? 'bg-[#0e2118] border-emerald-500 text-slate-100 ring-1 ring-emerald-500/50'
                    : 'bg-[#090d13]/95 border-[#17232e] text-slate-400 hover:text-slate-200 hover:border-[#223344] hover:bg-[#0d141d]'
                }`}
              >
                {/* Mini Cover Art */}
                <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-[#17232e]">
                  <CoverArt coverKey={deck.track.coverKey} title={deck.track.title} size="sm" />
                </div>

                {/* Track Title */}
                <div className="flex flex-col min-w-0 max-w-[100px] sm:max-w-[130px]">
                  <span className="text-[11px] font-semibold truncate leading-tight group-hover:text-emerald-300 transition-colors">
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
                  title={deck.isPlaying ? 'Pause this tab' : 'Play this tab'}
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
                  title={deck.isMuted ? 'Unmute tab' : 'Mute tab'}
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
                      ? 'text-teal-400 bg-teal-950/40'
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
                  title="Close concurrent tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Redesigned Sleek Master Pill */}
        <div className="flex items-center gap-1 bg-[#090d13]/95 border border-[#17232e] rounded-xl px-1.5 py-1 shadow-2xl shrink-0 backdrop-blur-md">
          <button
            onClick={hasAnyPlaying ? pauseAllDecks : playAllDecks}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-[#121c26] text-[11px] font-medium transition-all"
            title={hasAnyPlaying ? 'Pause all concurrent layers' : 'Play all concurrent layers'}
          >
            {hasAnyPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current text-emerald-400" />
                <span>Pause All</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-emerald-400" />
                <span>Play All</span>
              </>
            )}
          </button>

          <div className="w-[1px] h-3.5 bg-[#1a2634]" />

          <button
            onClick={clearAllDecks}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Close all tabs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
