import React, { useRef } from 'react';
import { Play, Pause, Heart, Music, Star, Check, FileText } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { useMultiDeckStore } from '../../stores/multiDeckStore';
import { useSettings } from '../../hooks/useSettings';
import { CoverArt } from '../common/CoverArt';
import { TrackDropdown } from '../common/TrackDropdown';
import { TrackContextMenu } from '../common/TrackContextMenu';
import { formatDuration } from '../../utils/formatters';
import { db } from '../../db/db';

interface TrackRowItemProps {
  track: Track;
  index: number;
  allTracks: Track[];
  density?: 'compact' | 'comfortable';
  isSelected?: boolean;
  isSelectionActive?: boolean;
  selectedIds?: Set<number>;
  onSelect?: (trackId: number, e?: React.MouseEvent) => void;
  onLongPressSelect?: (trackId: number) => void;
}

export const DraggableTrackRowItem: React.FC<TrackRowItemProps> = ({
  track,
  index: _index,
  allTracks,
  density = 'comfortable',
  isSelected = false,
  isSelectionActive = false,
  selectedIds = new Set(),
  onSelect,
  onLongPressSelect,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { decks } = useMultiDeckStore();
  const { data: settings } = useSettings();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const showArtist = settings?.showArtist ?? true;
  const showAlbum = settings?.showAlbum ?? true;
  const showDuration = settings?.showDuration ?? true;
  const showBitrate = settings?.showBitrate ?? true;
  const showRating = settings?.showRating ?? true;
  const showGenre = settings?.showGenre ?? true;
  const showPlayCount = settings?.showPlayCount ?? false;

  const dragSelectedTrackIds =
    isSelected && selectedIds.size > 0
      ? Array.from(selectedIds)
      : track.id
      ? [track.id]
      : [];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `track-${track.id}`,
    data: {
      track,
      selectedTrackIds: dragSelectedTrackIds,
    },
  });

  const isCurrent = currentTrack?.id === track.id;
  const isDeckActive = decks.some((d) => d.track.id === track.id);

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

  // Long press detection
  const handlePointerDown = (e: React.PointerEvent) => {
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
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPos.current || !longPressTimerRef.current) return;
    const deltaX = Math.abs(e.clientX - pointerStartPos.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartPos.current.y);
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
      return;
    }
    if (onSelect && track.id && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      onSelect(track.id, e);
      return;
    }
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, allTracks);
    }
  };

  const paddingClasses = density === 'compact' ? 'p-2' : 'p-2.5';

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
        className={`group relative flex items-center gap-3 rounded-2xl border transition-all duration-200 select-none cursor-pointer ${paddingClasses} ${
          isSelected
            ? 'bg-[#0f241a] border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
            : isCurrent
            ? 'bg-[#0d171d] border-emerald-500/60 ring-1 ring-emerald-500/30'
            : isDeckActive
            ? 'bg-[#09171b] border-teal-500/60 ring-1 ring-teal-500/30 shadow-md'
            : 'border-[#17232e] bg-[#0d1218] hover:border-[#243748] hover:bg-[#101720]'
        } ${isDragging ? 'opacity-30' : ''}`}
      >
        {/* Cover Art Container on the Left */}
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 bg-[#080b0f] shadow-md border border-[#17232e]">
          <CoverArt
            coverKey={track.coverKey}
            title={track.title}
            size="full"
          />

          {/* Hover Play Button */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <button
              onClick={handlePlayClick}
              className="p-2 rounded-full bg-emerald-500 text-slate-950 shadow-md"
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Selection indicator pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (track.id && onSelect) onSelect(track.id, e);
            }}
            className={`absolute top-1 left-1 z-10 w-4 h-4 rounded flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-emerald-500 text-slate-950 opacity-100'
                : isSelectionActive
                ? 'bg-black/70 border border-white/50 opacity-100 hover:border-emerald-400'
                : 'bg-black/60 border border-white/30 opacity-0 group-hover:opacity-100 hover:border-emerald-400'
            }`}
          >
            <Check className={`w-3 h-3 stroke-[3] ${isSelected ? 'text-slate-950' : 'text-transparent'}`} />
          </button>
        </div>

        {/* Rest of Info on the Right */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1.5">
            <p
              className={`font-semibold text-xs sm:text-sm truncate ${
                isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-200 group-hover:text-emerald-300'
              }`}
            >
              {track.title}
            </p>

            {/* Duration */}
            {showDuration && (
              <span className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                {formatDuration(track.duration)}
              </span>
            )}
          </div>

          {/* Subtitle: Artist & Album */}
          {(showArtist || showAlbum) && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {showArtist && <span>{track.artist}</span>}
              {showArtist && showAlbum && track.album && <span className="text-slate-600 mx-1">•</span>}
              {showAlbum && <span>{track.album}</span>}
            </p>
          )}

          {/* Bottom Row: Badges, Rating, Genre, Plays */}
          <div className="flex items-center gap-2 mt-1.5 text-[10px]">
            {showBitrate && (
              <span className="px-1.5 py-0.2 rounded bg-[#090e14] text-slate-400 border border-[#17232e] text-[9px] font-semibold uppercase font-mono">
                {track.bitrate ? `${track.bitrate}k ` : ''}{track.format}
              </span>
            )}

            {showGenre && track.genre && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[9px] font-medium text-emerald-400 truncate max-w-[80px]">
                {track.genre}
              </span>
            )}

            {showRating && (
              <div className="flex items-center gap-0.5 text-yellow-400 font-mono text-[10px] font-bold">
                <span>{track.rating > 0 ? track.rating : 5}</span>
                <Star className="w-2.5 h-2.5 fill-yellow-400" />
              </div>
            )}

            {track.description && (
              <span
                className="px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[9px] font-medium text-emerald-400 flex items-center gap-0.5"
                title="Has Markdown Notes"
              >
                <FileText className="w-2.5 h-2.5" />
                <span>Notes</span>
              </span>
            )}

            {showPlayCount && (
              <span className="text-blue-300 font-mono text-[10px]">
                {track.playCount || 0} plays
              </span>
            )}

            <div className="ml-auto flex items-center gap-1">
              {/* Favorite Heart */}
              <button
                onClick={handleFavoriteClick}
                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${track.isFavorite ? 'text-rose-500 fill-rose-500' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              <TrackDropdown track={track} />
            </div>
          </div>
        </div>
      </div>
    </TrackContextMenu>
  );
};

interface TrackRowListProps {
  tracks: Track[];
  density?: 'compact' | 'comfortable';
  selectedIds?: Set<number>;
  onSelectTrack?: (trackId: number, e?: React.MouseEvent) => void;
  onLongPressSelect?: (trackId: number) => void;
}

export const TrackRowList: React.FC<TrackRowListProps> = ({
  tracks,
  density = 'comfortable',
  selectedIds = new Set(),
  onSelectTrack,
  onLongPressSelect,
}) => {
  const { data: settings } = useSettings();
  const tracksPerRow = settings?.tracksPerRow || 2;

  const gridColClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[tracksPerRow] || 'grid-cols-1 md:grid-cols-2';

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
    <div className={`grid ${gridColClasses} gap-2.5`}>
      {tracks.map((track, idx) => (
        <DraggableTrackRowItem
          key={track.id}
          track={track}
          index={idx}
          allTracks={tracks}
          density={density}
          isSelected={track.id ? selectedIds.has(track.id) : false}
          isSelectionActive={isSelectionActive}
          selectedIds={selectedIds}
          onSelect={onSelectTrack}
          onLongPressSelect={onLongPressSelect || onSelectTrack}
        />
      ))}
    </div>
  );
};

