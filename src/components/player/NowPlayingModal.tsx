import React, { useState } from 'react';
import {
  ChevronDown,
  Heart,
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Activity,
  Disc3,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { usePlayerStore, type VisualizerMode } from '../../stores/playerStore';
import { useSettings } from '../../hooks/useSettings';
import { CoverArt } from '../common/CoverArt';
import { StarRating } from '../common/StarRating';
import { VisualizerCanvas } from './VisualizerCanvas';
import { YouTubeMiniPlayer } from './YouTubeMiniPlayer';
import { formatDuration, getAudioQualityBadge } from '../../utils/formatters';
import { db } from '../../db/db';

export const NowPlayingModal: React.FC = () => {
  const { data: settings } = useSettings();
  const showAlbum = settings?.showAlbum ?? true;
  const showBitrate = settings?.showBitrate ?? true;
  const showRating = settings?.showRating ?? true;
  const showGenre = settings?.showGenre ?? true;
  const showPlayCount = settings?.showPlayCount ?? false;

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
    isNowPlayingOpen,
    visualizerMode,
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
    setVisualizerMode,
    toggleFavoriteCurrent,
  } = usePlayerStore();


  const [activeTab, setActiveTab] = useState<'visualizer' | 'lyrics' | 'details'>('visualizer');
  const [artworkMode, setArtworkMode] = useState<'cover' | 'vinyl'>('vinyl');

  if (!isNowPlayingOpen || !currentTrack) return null;

  const quality = getAudioQualityBadge(currentTrack.format, currentTrack.bitrate, currentTrack.sampleRate);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleRatingChange = async (rating: number) => {
    if (currentTrack.id) {
      await db.tracks.update(currentTrack.id, { rating });
      currentTrack.rating = rating;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-2xl text-zinc-100 overflow-hidden animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 shrink-0">
        <button
          onClick={() => setNowPlayingOpen(false)}
          className="flex items-center gap-2 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
            Minimize
          </span>
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl glass-card border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'visualizer'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Visualizer</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>

        {/* Artwork Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setArtworkMode(artworkMode === 'vinyl' ? 'cover' : 'vinyl')}
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
              artworkMode === 'vinyl'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800'
            }`}
            title="Toggle Vinyl / Artwork mode"
          >
            <Disc3 className="w-4 h-4" />
            <span className="hidden md:inline">{artworkMode === 'vinyl' ? 'Vinyl Mode' : 'Artwork'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-8 md:gap-12 overflow-y-auto">
        {/* Left / Center: Artwork, Video or Vinyl Visual */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-md shrink-0">
          {currentTrack.source === 'youtube' && currentTrack.youtubeId ? (
            <YouTubeMiniPlayer className="w-full max-w-md" />
          ) : artworkMode === 'vinyl' ? (
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Outer Vinyl Disc */}
              <div
                className={`relative w-full h-full rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden ${
                  isPlaying ? 'animate-spin-slow' : 'paused'
                }`}
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-4 rounded-full border border-zinc-800/80" />
                <div className="absolute inset-8 rounded-full border border-zinc-700/40" />
                <div className="absolute inset-12 rounded-full border border-zinc-800/60" />
                <div className="absolute inset-16 rounded-full border border-zinc-700/30" />
                <div className="absolute inset-20 rounded-full border border-zinc-800/50" />
                <div className="absolute inset-24 rounded-full border border-zinc-700/20" />

                {/* Center Label with Track Cover */}
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-cyan-400/50 shadow-inner flex items-center justify-center">
                  <CoverArt coverKey={currentTrack.coverKey} title={currentTrack.title} size="full" />
                  {/* Center Spindle Hole */}
                  <div className="absolute w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-700 shadow-md" />
                </div>
              </div>

              {/* Tonearm Overlay Graphic */}
              <div
                className={`absolute -top-4 -right-4 w-24 h-40 pointer-events-none transition-transform duration-700 origin-top-right ${
                  isPlaying ? 'rotate-12' : '-rotate-12 opacity-60'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20 absolute right-0 top-0" />
                <div className="w-1 h-32 bg-zinc-400 absolute right-1 top-2 origin-top rounded-full shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 glow-cyan">
              <CoverArt coverKey={currentTrack.coverKey} title={currentTrack.title} size="full" />
            </div>
          )}

          {/* Track Quality Badge */}
          <div className="mt-4 flex items-center gap-2">
            {showBitrate && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${quality.color}`}
              >
                {quality.label}
              </span>
            )}
            {currentTrack.year && (
              <span className="text-xs text-zinc-500 font-mono">({currentTrack.year})</span>
            )}
          </div>
        </div>

        {/* Right: Dynamic View (Visualizer / Synced Lyrics / Specs) */}
        <div className="flex-1 w-full max-w-xl flex flex-col justify-center h-full min-h-[300px]">
          {activeTab === 'visualizer' && (
            <div className="flex flex-col h-full justify-between glass-card p-6 rounded-3xl border border-zinc-800">
              {/* Visualizer Mode Switch */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Real-time Spectrum
                </span>
                <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl text-xs border border-zinc-800">
                  {(['bars', 'wave', 'circle'] as VisualizerMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setVisualizerMode(mode)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                        visualizerMode === mode
                          ? 'bg-cyan-500/30 text-cyan-300 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Spectrum Display */}
              <div className="flex-1 min-h-[180px] w-full relative flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950/60 border border-zinc-800/60 p-2">
                <VisualizerCanvas className="w-full h-full" />
              </div>

              {/* Audio spec tickers */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/60 text-center">
                <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                  <p className="text-[10px] text-zinc-500 uppercase">Sample Rate</p>
                  <p className="text-xs font-mono font-semibold text-zinc-200">
                    {currentTrack.sampleRate ? `${(currentTrack.sampleRate / 1000).toFixed(1)} kHz` : '44.1 kHz'}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                  <p className="text-[10px] text-zinc-500 uppercase">Bitrate</p>
                  <p className="text-xs font-mono font-semibold text-cyan-400">
                    {currentTrack.bitrate ? `${currentTrack.bitrate} kbps` : 'Lossless'}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                  <p className="text-[10px] text-zinc-500 uppercase">Channel</p>
                  <p className="text-xs font-mono font-semibold text-purple-400">Stereo (2.0)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="h-full glass-card p-6 rounded-3xl border border-zinc-800 space-y-4 overflow-y-auto">
              <h3 className="font-bold text-sm text-cyan-400 uppercase tracking-wider">
                Track Metadata & Storage
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-500">Title</span>
                  <span className="font-semibold text-zinc-200">{currentTrack.title}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-500">Artist</span>
                  <span className="font-semibold text-zinc-200">{currentTrack.artist}</span>
                </div>
                {showAlbum && (
                  <div className="flex justify-between py-1.5 border-b border-zinc-800">
                    <span className="text-zinc-500">Album</span>
                    <span className="font-semibold text-zinc-200">{currentTrack.album || '—'}</span>
                  </div>
                )}
                {showGenre && (
                  <div className="flex justify-between py-1.5 border-b border-zinc-800">
                    <span className="text-zinc-500">Genre</span>
                    <span className="font-semibold text-zinc-200">{currentTrack.genre || '—'}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-500">OPFS Storage Key</span>
                  <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[200px]">
                    {currentTrack.fileKey}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-500">SHA-256 Checksum</span>
                  <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[200px]">
                    {currentTrack.fileHash}
                  </span>
                </div>
                {showPlayCount && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Play Count</span>
                    <span className="font-semibold text-zinc-200">{currentTrack.playCount || 0} times</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Expanded Controls Bar */}
      <div className="p-6 md:px-12 bg-zinc-950/80 border-t border-zinc-800/80 shrink-0">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Title, Artist, Favorite, Rating Row */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-extrabold text-zinc-100 truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm md:text-base text-zinc-400 truncate font-medium">
                {currentTrack.artist} {showAlbum && currentTrack.album ? `• ${currentTrack.album}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {showRating && (
                <StarRating rating={currentTrack.rating} onChange={handleRatingChange} size="md" />
              )}
              <button
                onClick={toggleFavoriteCurrent}
                className="p-2 rounded-xl text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                title="Toggle favorite"
              >
                <Heart
                  className={`w-6 h-6 ${
                    currentTrack.isFavorite ? 'text-pink-500 fill-pink-500' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Scrub Progress Bar */}
          <div className="space-y-1">
            <div className="relative flex items-center group cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg bg-zinc-800 appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${progressPercent}%, #27272a ${progressPercent}%, #27272a 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-zinc-500">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback Button Controls */}
          <div className="flex items-center justify-between">
            {/* Speed selector & Mute */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-colors ${
                  isShuffle ? 'text-cyan-400 bg-cyan-500/20' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
              </select>
            </div>

            {/* Center Playback Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={prevTrack}
                className="p-3 rounded-2xl text-zinc-300 hover:text-zinc-100 hover:bg-white/10 transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={togglePlay}
                className="p-4 rounded-3xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 hover:opacity-90 shadow-xl shadow-cyan-500/25 transition-opacity"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 rounded-2xl text-zinc-300 hover:text-zinc-100 hover:bg-white/10 transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Right: Repeat & Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={cycleRepeatMode}
                className={`p-2 rounded-xl transition-colors ${
                  repeatMode !== 'off'
                    ? 'text-cyan-400 bg-cyan-500/20'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
