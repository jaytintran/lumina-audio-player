import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Maximize2,
  ChevronUp,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettings } from '../../hooks/useSettings';
import { CoverArt } from '../common/CoverArt';
import { AudioDetailsModal } from '../library/AudioDetailsModal';
import { formatDuration } from '../../utils/formatters';

export const PlayerBar: React.FC = () => {
  const { data: settings } = useSettings();
  const showBitrate = settings?.showBitrate ?? true;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isShuffle,
    repeatMode,
    queue,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeatMode,
    setNowPlayingOpen,
    setQueueOpen,
    isQueueOpen,
    toggleFavoriteCurrent,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#080b0f] border-t border-[#17232e] px-4 pt-3.5 pb-2.5 shadow-2xl">
        {/* Elevated Details / Notes Tab Handle on top border */}
        <button
          onClick={() => setIsDetailsOpen(true)}
          className="absolute left-1/2 -translate-x-1/2 -top-4 z-50 h-4 px-3 rounded-t-lg bg-[#080b0f] border-t border-x border-[#17232e] hover:border-emerald-500/60 text-slate-500 hover:text-emerald-400 flex items-center justify-center shadow-md hover:h-5 hover:-top-5 transition-all group cursor-pointer"
          title="Audio Details & Notes (Markdown)"
        >
          <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Track Information & Artwork */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <div
            onClick={() => setNowPlayingOpen(true)}
            className="cursor-pointer group relative shrink-0"
          >
            <CoverArt coverKey={currentTrack.coverKey} title={currentTrack.title} size="md" />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                onClick={() => setNowPlayingOpen(true)}
                className="font-bold text-xs sm:text-sm text-slate-100 truncate hover:text-emerald-400 cursor-pointer transition-colors"
              >
                {currentTrack.title}
              </p>
              {showBitrate && (
                <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#090e14] border border-[#17232e] text-slate-400">
                  {currentTrack.format}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
          </div>

          <button
            onClick={toggleFavoriteCurrent}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
            title="Toggle favorite"
          >
            <Heart
              className={`w-4 h-4 ${
                currentTrack.isFavorite ? 'text-rose-500 fill-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 max-w-xl w-2/4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition-colors ${
                isShuffle ? 'text-emerald-400 bg-[#0f241a]' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={prevTrack}
              className="p-1.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2.5 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/30 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={cycleRepeatMode}
              className={`p-1.5 rounded-lg transition-colors ${
                repeatMode !== 'off'
                  ? 'text-emerald-400 bg-[#0f241a]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Scrub Bar */}
          <div className="w-full flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="w-9 text-right">{formatDuration(currentTime)}</span>
            <div className="relative flex-1 flex items-center group cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-[#141e28] appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${progressPercent}%, #141e28 ${progressPercent}%, #141e28 100%)`,
                }}
              />
            </div>
            <span className="w-9">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: Rate, Volume, Queue & Expand */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="hidden sm:block bg-[#0d1218] border border-[#17232e] text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>

          {/* Volume slider */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1.5 rounded-lg bg-[#141e28] appearance-none cursor-pointer"
            />
          </div>

          {/* Queue Drawer Button */}
          <button
            onClick={() => setQueueOpen(!isQueueOpen)}
            className={`relative p-2 rounded-xl border transition-colors ${
              isQueueOpen
                ? 'bg-[#0f241a] text-emerald-300 border-emerald-500/40'
                : 'text-slate-400 border-[#17232e] hover:text-slate-200 hover:bg-[#0d1218]'
            }`}
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>

          {/* Expand Button */}
          <button
            onClick={() => setNowPlayingOpen(true)}
            className="p-2 rounded-xl text-slate-400 border border-[#17232e] hover:text-slate-200 hover:bg-[#0d1218] transition-colors"
            title="Expand Now Playing"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    {isDetailsOpen && currentTrack && (
      <AudioDetailsModal
        track={currentTrack}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    )}
  </>
);
};
