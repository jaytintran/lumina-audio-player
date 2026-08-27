import React, { useRef } from 'react';
import { Play, Pause, Star, Music, Check, Heart } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettings } from '../../hooks/useSettings';
import { CoverArt } from '../common/CoverArt';
import { TrackContextMenu } from '../common/TrackContextMenu';
import { formatDuration } from '../../utils/formatters';
import { db } from '../../db/db';

interface TrackCardProps {
  track: Track;
  allTracks: Track[];
  isSelected?: boolean;
  isSelectionActive?: boolean;
  onSelect?: (trackId: number, e?: React.MouseEvent) => void;
  onLongPressSelect?: (trackId: number) => void;
}

export const DraggableTrackCard: React.FC<TrackCardProps> = ({
  track,
  allTracks,
  isSelected = false,
  isSelectionActive = false,
  onSelect,
  onLongPressSelect,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { data: settings } = useSettings();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const showArtist = settings?.showArtist ?? true;
  const showAlbum = settings?.showAlbum ?? true;
  const showDuration = settings?.showDuration ?? true;
  const showBitrate = settings?.showBitrate ?? true;
  const showRating = settings?.showRating ?? true;
  const showGenre = settings?.showGenre ?? true;
  const showTags = settings?.showTags ?? true;
  const showPlayCount = settings?.showPlayCount ?? false;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `track-${track.id}`,
    data: { track },
  });

  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.id) {
      await db.tracks.update(track.id, { isFavorite: !track.isFavorite });
    }
  };

  const pointerStartPos = useRef<{ x: number; y: number } | null>(null);

  // Long press detection handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    isLongPressRef.current = false;
    pointerStartPos.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (track.id && onLongPressSelect) {
        onLongPressSelect(track.id);
      }
    }, 450); // 450ms long press threshold
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPos.current || !longPressTimerRef.current) return;
    const deltaX = Math.abs(e.clientX - pointerStartPos.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartPos.current.y);
    // If user moved finger/mouse more than 6px, it's a drag or scroll - cancel long press immediately
    if (deltaX > 6 || deltaY > 6) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartPos.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (isSelectionActive && onSelect && track.id) {
      onSelect(track.id, e);
    } else if (onSelect && track.id && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      onSelect(track.id, e);
    }
  };

  return (
    <TrackContextMenu track={track}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          listeners?.onPointerDown?.(e);
          handlePointerDown(e);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e);
        }}
        onPointerUp={(e) => {
          listeners?.onPointerUp?.(e);
          handlePointerUp();
        }}
        onPointerCancel={(e) => {
          listeners?.onPointerCancel?.(e);
          handlePointerUp();
        }}
        onClick={handleClick}
        className={`group relative rounded-2xl bg-[#0d1218] border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
          isSelected
            ? 'border-emerald-500 bg-[#0f241a] ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : isCurrent
            ? 'border-emerald-500/70 bg-[#0b161c]'
            : 'border-[#17232e] hover:border-[#243748] hover:bg-[#101720]'
        } ${isDragging ? 'opacity-30' : ''}`}
      >
        {/* Top: Square Artwork with Floating Overlays */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden shrink-0 bg-[#080b0f] shadow-md border border-[#17232e]/60 mb-2.5">
          <CoverArt coverKey={track.coverKey} title={track.title} size="full" />

          {/* Selection Checkbox (always visible if selected or selection mode active, hover otherwise) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (track.id && onSelect) onSelect(track.id, e);
            }}
            className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400 font-bold opacity-100'
                : isSelectionActive
                ? 'bg-black/60 border border-white/40 text-transparent opacity-100 hover:border-emerald-400'
                : 'bg-black/50 border border-white/30 text-transparent opacity-0 group-hover:opacity-100 hover:border-emerald-400'
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'text-slate-950' : 'text-transparent'}`} />
          </button>

          {/* Favorite Heart on top right */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-xs text-slate-300 hover:text-rose-400 transition-opacity opacity-0 group-hover:opacity-100"
          >
            <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'text-rose-500 fill-rose-500 opacity-100' : ''}`} />
          </button>

          {/* Rating Badge on Bottom Left of Artwork */}
          {showRating && (
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs flex items-center gap-1 text-yellow-400 font-mono text-[10px] font-bold border border-white/10">
              <span>{track.rating > 0 ? track.rating : 5}</span>
              <Star className="w-2.5 h-2.5 fill-yellow-400" />
            </div>
          )}

          {/* Duration Badge on Bottom Right of Artwork */}
          {showDuration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-slate-300 font-mono text-[10px] border border-white/10">
              {formatDuration(track.duration)}
            </div>
          )}

          {/* Center Play Overlay */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center transition-opacity duration-150 ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <button
              onClick={handlePlayClick}
              className="p-3 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40 hover:scale-105 transition-transform"
              title={isCurrent && isPlaying ? 'Pause' : 'Play'}
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Details Section (Vertical Orientation) */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3
              className={`font-bold text-xs sm:text-sm line-clamp-1 leading-snug ${
                isCurrent ? 'text-emerald-400' : 'text-slate-100 group-hover:text-emerald-300'
              }`}
              title={track.title}
            >
              {track.title}
            </h3>

            {/* Artist & Album */}
            {(showArtist || showAlbum) && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {showArtist && track.artist}
                {showArtist && showAlbum && track.album && <span className="text-slate-600 mx-1">•</span>}
                {showAlbum && track.album}
              </p>
            )}
          </div>

          {/* Badges & Meta Row */}
          {((showBitrate) || (showGenre && track.genre) || (showTags && track.tags && track.tags.length > 0) || (showPlayCount)) && (
            <div className="flex flex-wrap items-center gap-1 mt-2 pt-1 border-t border-[#17232e]/50 text-[9px]">
              {showBitrate && (
                <span className="px-1.5 py-0.5 rounded bg-[#090e14] border border-[#17232e] text-slate-400 font-mono uppercase font-semibold">
                  {track.bitrate ? `${track.bitrate}k ` : ''}{track.format}
                </span>
              )}
              {showGenre && track.genre && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-medium truncate max-w-[80px]">
                  {track.genre}
                </span>
              )}
              {showTags && track.tags && track.tags.slice(0, 1).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-[#090e14] border border-[#17232e] text-slate-400 font-medium truncate max-w-[70px]"
                >
                  {tag}
                </span>
              ))}
              {showPlayCount && (
                <span className="px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-300 font-mono ml-auto">
                  {track.playCount || 0} plays
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </TrackContextMenu>
  );
};

interface TrackGridProps {
  tracks: Track[];
  selectedIds?: Set<number>;
  onSelectTrack?: (trackId: number, e?: React.MouseEvent) => void;
  onLongPressSelect?: (trackId: number) => void;
}

export const TrackGrid: React.FC<TrackGridProps> = ({
  tracks,
  selectedIds = new Set(),
  onSelectTrack,
  onLongPressSelect,
}) => {
  const { data: settings } = useSettings();
  const tracksPerRow = settings?.tracksPerRow || 4;

  const gridColClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  }[tracksPerRow] || 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
        <Music className="w-12 h-12 mb-3 opacity-30 text-emerald-400" />
        <p className="text-sm font-semibold text-slate-300">No tracks in this section</p>
        <p className="text-xs text-slate-600 mt-1">
          Import audio files or generate sample ambient music to get started
        </p>
      </div>
    );
  }

  const isSelectionActive = selectedIds.size > 0;

  return (
    <div className={`grid ${gridColClasses} gap-3.5`}>
      {tracks.map((track) => (
        <DraggableTrackCard
          key={track.id}
          track={track}
          allTracks={tracks}
          isSelected={track.id ? selectedIds.has(track.id) : false}
          isSelectionActive={isSelectionActive}
          onSelect={onSelectTrack}
          onLongPressSelect={onLongPressSelect || onSelectTrack}
        />
      ))}
    </div>
  );
};
