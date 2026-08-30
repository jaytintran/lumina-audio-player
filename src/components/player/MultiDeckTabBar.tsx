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

export const MultiDeckTabBar: React.FC = () => {
  const {
    decks,
    activeDeckId,
    masterVolume,
    isMasterLooping,
    setActiveDeck,
    togglePlayDeck,
    toggleMuteDeck,
    toggleDeckLoop,
    removeDeck,
    clearAllDecks,
    pauseAllDecks,
    playAllDecks,
    setMasterVolume,
    toggleMasterLoop,
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
    <div className="fixed bottom-[86px] left-0 md:left-64 right-0 z-40 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
      <div className="w-full px-4 sm:px-6 pointer-events-auto">
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#090e15]/95 backdrop-blur-md border border-[#1b2a3a] shadow-2xl">
          {/* Left: Horizontal Scrollable Tabs Strip (Cover art hidden) */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5 px-1 flex-nowrap min-w-0">
            {decks.map((deck) => {
              const isActive = activeDeckId === deck.id;
              return (
                <div
                  key={deck.id}
                  onClick={() => handleTabClick(deck.id)}
                  title="Click to view & control in main player"
                  className={`group relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border transition-all cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-[#10221c] border-emerald-500/60 text-slate-100 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-[#0c1219] hover:bg-[#121b25] border-[#1a2735] hover:border-[#2b3e52] text-slate-300'
                  }`}
                >
                  {/* Playing Live Dot indicator */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    {deck.isPlaying ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </>
                    ) : (
                      <span className="inline-flex rounded-full h-2 w-2 bg-slate-600" />
                    )}
                  </span>

                  {/* Title & Artist */}
                  <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[180px]">
                    <span
                      className={`text-xs font-semibold truncate leading-tight transition-colors ${
                        isActive ? 'text-emerald-400' : 'group-hover:text-emerald-300 text-slate-200'
                      }`}
                    >
                      {deck.track.title}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
                      {deck.track.artist}
                    </span>
                  </div>

                  {/* Tab Action Controls */}
                  <div className="flex items-center gap-0.5 ml-1.5">
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
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
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
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                      }`}
                      title={deck.isMuted ? 'Unmute tab' : 'Mute tab'}
                    >
                      {deck.isMuted ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
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
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                      title={deck.isLooping ? 'Looping enabled' : 'Click to loop'}
                    >
                      <Repeat className="w-3.5 h-3.5" />
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
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Master Multi-Channel Controller Pill with Master Volume & Master Loop */}
          <div className="flex items-center gap-2 bg-[#0d141d] border border-[#1e2d3e] rounded-xl px-3 py-1.5 shrink-0 shadow-inner">
            {/* Master Play/Pause All */}
            <button
              onClick={hasAnyDeckPlaying ? pauseAllDecks : playAllDecks}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-200 hover:text-emerald-300 hover:bg-[#14202d] text-xs font-medium transition-all"
              title={hasAnyDeckPlaying ? 'Pause all playing tabs' : 'Play all tabs'}
            >
              {hasAnyDeckPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current text-emerald-400" />
                  <span className="hidden sm:inline">Pause All</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current text-emerald-400" />
                  <span className="hidden sm:inline">Play All</span>
                </>
              )}
            </button>

            {/* Master Loop All Toggle */}
            <button
              onClick={toggleMasterLoop}
              className={`p-1.5 rounded-lg transition-colors ${
                isMasterLooping
                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#14202d]'
              }`}
              title={isMasterLooping ? 'Master Loop enabled for all tabs' : 'Loop all tabs'}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Master Volume Slider */}
            <div className="flex items-center gap-1.5 pl-1">
              <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-emerald-500 h-1 bg-[#1a2938] rounded-lg cursor-pointer"
                title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
              />
            </div>

            <div className="w-[1px] h-3.5 bg-[#223347]" />

            {/* Close All */}
            <button
              onClick={clearAllDecks}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Close all tabs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
