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
    removeDeck,
    clearAllDecks,
    pauseAllDecks,
    playAllDecks,
    swapWithMainTrack,
  } = useMultiDeckStore();

  const { currentTrack, playTrack } = usePlayerStore();

  if (decks.length === 0) return null;

  const hasAnyDeckPlaying = decks.some((d) => d.isPlaying);

  const handleTabClick = async (deckId: string) => {
    setActiveDeck(deckId);
    const selectedTrack = await swapWithMainTrack(deckId, currentTrack);
    if (selectedTrack) {
      playTrack(selectedTrack);
    }
  };

  return (
    <div className="fixed bottom-[74px] left-0 right-0 z-30 pointer-events-none animate-in slide-in-from-bottom-2 duration-200">
      <div className="max-w-7xl mx-auto px-4 pointer-events-auto">
        <div className="flex items-end justify-between gap-3">
          {/* Browser-style Tab Ribbon */}
          <div className="flex items-end gap-1.5 overflow-x-auto no-scrollbar pt-2 pr-2">
            {decks.map((deck) => {
              const isActive = activeDeckId === deck.id;
              return (
                <div
                  key={deck.id}
                  onClick={() => handleTabClick(deck.id)}
                  title="Click to view & control in main player"
                  className={`group relative flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-t-xl border-t border-x transition-all cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-[#080b0f] border-[#1e2c3a] text-slate-100 shadow-md after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-[#080b0f]'
                      : 'bg-[#0a0f16]/90 hover:bg-[#0e1620] border-[#16222e] hover:border-[#223548] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Mini Cover with playing pulse */}
                  <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-[#1e2c3a] relative">
                    <CoverArt coverKey={deck.track.coverKey} title={deck.track.title} size="sm" />
                    {deck.isPlaying && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <div className="flex flex-col min-w-0 max-w-[100px] sm:max-w-[130px]">
                    <span
                      className={`text-[11px] font-semibold truncate leading-tight transition-colors ${
                        isActive ? 'text-emerald-400' : 'group-hover:text-emerald-300'
                      }`}
                    >
                      {deck.track.title}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate leading-none mt-0.5">
                      {deck.track.artist}
                    </span>
                  </div>

                  {/* Tab Action Controls */}
                  <div className="flex items-center gap-0.5">
                    {/* Play / Pause Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayDeck(deck.id);
                      }}
                      className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title={deck.isPlaying ? 'Pause tab' : 'Play tab'}
                    >
                      {deck.isPlaying ? (
                        <Pause className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Mute Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMuteDeck(deck.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        deck.isMuted
                          ? 'text-rose-400 bg-rose-950/40'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/10'
                      }`}
                      title={deck.isMuted ? 'Unmute tab' : 'Mute tab'}
                    >
                      {deck.isMuted ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>

                    {/* Loop Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeckLoop(deck.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        deck.isLooping
                          ? 'text-emerald-400 bg-emerald-950/40'
                          : 'text-slate-600 hover:text-slate-300'
                      }`}
                      title={deck.isLooping ? 'Looping enabled' : 'Click to loop'}
                    >
                      <Repeat className="w-3 h-3" />
                    </button>

                    {/* Close Tab Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDeck(deck.id);
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                      title="Close tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Master Multi-Channel Controller Ribbon */}
          <div className="flex items-center gap-1.5 bg-[#090d13] border-t border-x border-[#17232e] rounded-t-xl px-2.5 py-1 shadow-lg shrink-0 mb-[1px]">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium px-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>{decks.length} Tabs Open</span>
            </div>

            <div className="w-[1px] h-3 bg-[#1e2c3a]" />

            <button
              onClick={hasAnyDeckPlaying ? pauseAllDecks : playAllDecks}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-slate-300 hover:text-emerald-300 hover:bg-[#121c26] text-[10px] font-medium transition-all"
              title={hasAnyDeckPlaying ? 'Pause all playing tabs' : 'Play all tabs'}
            >
              {hasAnyDeckPlaying ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-current text-emerald-400" />
                  <span>Pause All</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current text-emerald-400" />
                  <span>Play All</span>
                </>
              )}
            </button>

            <button
              onClick={clearAllDecks}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Close all tabs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
