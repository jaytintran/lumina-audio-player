import React, { useState } from 'react';
import { X, Trash2, GripVertical, Music, Play, Disc, Plus, Check } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlaylists } from '../../hooks/usePlaylists';
import { CoverArt } from '../common/CoverArt';
import { formatDuration } from '../../utils/formatters';
import type { Track } from '../../db/schema';

interface SortableQueueItemProps {
  track: Track;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({ track, index, onPlay, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `queue-${index}-${track.id || index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 p-2 rounded-xl bg-[#0a0f15] border border-[#16222f] hover:border-emerald-500/30 transition-all text-xs"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <CoverArt coverKey={track.coverKey} title={track.title} size="sm" />

      <div className="flex-1 min-w-0" onClick={onPlay}>
        <p className="font-semibold text-slate-200 truncate group-hover:text-emerald-400 cursor-pointer">
          {track.title}
        </p>
        <p className="text-slate-400 truncate text-[11px]">{track.artist}</p>
      </div>

      <span className="text-slate-500 font-mono text-[11px]">{formatDuration(track.duration)}</span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPlay}
          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20"
          title="Play now"
        >
          <Play className="w-3.5 h-3.5 fill-emerald-400" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20"
          title="Remove from queue"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const QueueDrawer: React.FC = () => {
  const {
    queue,
    currentTrack,
    isQueueOpen,
    setQueueOpen,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playTrack,
  } = usePlayerStore();

  const { createPlaylist, addTracksToPlaylist } = usePlaylists();
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isQueueOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((t, idx) => `queue-${idx}-${t.id || idx}` === active.id);
      const newIndex = queue.findIndex((t, idx) => `queue-${idx}-${t.id || idx}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQueue(oldIndex, newIndex);
      }
    }
  };

  const handleSaveAsPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = playlistName.trim() || `Queue - ${new Date().toLocaleDateString()}`;
    const allQueueTracks = currentTrack ? [currentTrack, ...queue] : queue;
    const trackIds = allQueueTracks.map((t) => t.id).filter((id): id is number => typeof id === 'number');

    if (trackIds.length > 0) {
      const newPlaylistId = await createPlaylist(name);
      if (newPlaylistId) {
        await addTracksToPlaylist(newPlaylistId as number, trackIds);
        setSaveSuccess(true);
        setIsSavingPlaylist(false);
        setPlaylistName('');
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    }
  };

  const totalQueueCount = (currentTrack ? 1 : 0) + queue.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-[#080c10] border-l border-[#17232e] flex flex-col shadow-2xl p-6 overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#17232e]">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-slate-100">Play Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#121c27] text-slate-300 font-mono border border-[#1b2a3a]">
              {totalQueueCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {totalQueueCount > 0 && (
              <button
                onClick={() => setIsSavingPlaylist(!isSavingPlaylist)}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-emerald-300 px-2.5 py-1.5 rounded-xl bg-[#101822] border border-[#1e2d3e] hover:border-emerald-500/40 transition-colors"
                title="Save queue as a new playlist"
              >
                <Disc className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Playlist</span>
              </button>
            )}

            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => setQueueOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save As Playlist Inline Dialog */}
        {isSavingPlaylist && (
          <form onSubmit={handleSaveAsPlaylist} className="my-3 p-3 rounded-2xl bg-[#0d141d] border border-emerald-500/40 space-y-2.5 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-emerald-400" />
                <span>Name this Playlist</span>
              </span>
              <span className="text-[10px] text-slate-400">({totalQueueCount} tracks)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder={`e.g. Chill Session ${new Date().toLocaleDateString()}`}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#070b0f] border border-[#1e2d3e] text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save</span>
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="my-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            <span>Queue saved as new playlist!</span>
          </div>
        )}

        {/* Currently Playing Track Highlight */}
        {currentTrack && (
          <div className="my-4 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-500/30">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-2">
              Now Playing
            </p>
            <div className="flex items-center gap-3">
              <CoverArt coverKey={currentTrack.coverKey} title={currentTrack.title} size="md" showGlow />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-zinc-100 truncate">{currentTrack.title}</p>
                <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {formatDuration(currentTrack.duration)}
              </span>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1 mb-2">
            Up Next
          </p>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
              <Music className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Queue is empty</p>
              <p className="text-xs text-zinc-600 mt-1">
                Drag tracks here or click "Add to Queue" from the library
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={queue.map((t, idx) => `queue-${idx}-${t.id || idx}`)}
                strategy={verticalListSortingStrategy}
              >
                {queue.map((track, idx) => (
                  <SortableQueueItem
                    key={`queue-${idx}-${track.id || idx}`}
                    track={track}
                    index={idx}
                    onPlay={() => {
                      removeFromQueue(idx);
                      playTrack(track);
                    }}
                    onRemove={() => removeFromQueue(idx)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
};
