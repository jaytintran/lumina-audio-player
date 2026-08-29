import React, { useState } from 'react';
import {
  X,
  Trash2,
  GripVertical,
  Music,
  Play,
  Pause,
  Disc,
  Plus,
  Check,
  Shuffle,
  Clock,
  RotateCcw,
  ListMusic,
} from 'lucide-react';
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
  isActive?: boolean;
  isPast?: boolean;
  prefix?: string;
  onPlay: () => void;
  onRemove: () => void;
}

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({
  track,
  index,
  isActive = false,
  isPast = false,
  prefix = 'queue',
  onPlay,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${prefix}-${index}-${track.id || index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : isPast ? 0.65 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2.5 p-2 rounded-xl border transition-all text-xs ${
        isActive
          ? 'bg-[#0e2118] border-emerald-500/70 text-slate-100 ring-1 ring-emerald-500/40 shadow-md'
          : isPast
          ? 'bg-[#080b0f] border-[#141d27] text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
          : 'bg-[#090e14] border-[#16222f] hover:border-emerald-500/40 hover:bg-[#0d151e]'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        style={{ touchAction: 'none' }}
        className="text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing p-1 rounded transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#1b2a3a] relative">
        <CoverArt coverKey={track.coverKey} title={track.title} size="sm" />
        {isActive && (
          <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
        <p
          className={`font-semibold truncate transition-colors leading-tight ${
            isActive ? 'text-emerald-400' : isPast ? 'text-slate-400' : 'text-slate-200 group-hover:text-emerald-300'
          }`}
        >
          {track.title}
        </p>
        <p className="text-slate-500 truncate text-[11px] mt-0.5">{track.artist}</p>
      </div>

      <span className="text-slate-500 font-mono text-[11px] shrink-0">
        {formatDuration(track.duration)}
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          title="Play track"
        >
          <Play className="w-3.5 h-3.5 fill-emerald-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
          title="Remove from list"
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
    currentIndex,
    userQueue,
    currentTrack,
    history,
    isPlaying,
    currentTime,
    duration,
    isQueueOpen,
    setQueueOpen,
    removeFromQueue,
    removeFromUserQueue,
    reorderQueue,
    reorderUserQueue,
    clearQueue,
    clearUserQueue,
    clearHistory,
    shuffleQueue,
    playQueueIndex,
    playUserQueueIndex,
    playTrack,
    togglePlay,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
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

  const handleQueueDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId.startsWith('user-') && overId.startsWith('user-')) {
        const oldIndex = userQueue.findIndex((t, idx) => `user-${idx}-${t.id || idx}` === activeId);
        const newIndex = userQueue.findIndex((t, idx) => `user-${idx}-${t.id || idx}` === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderUserQueue(oldIndex, newIndex);
        }
      } else if (activeId.startsWith('main-') && overId.startsWith('main-')) {
        const oldIndex = queue.findIndex((t, idx) => `main-${idx}-${t.id || idx}` === activeId);
        const newIndex = queue.findIndex((t, idx) => `main-${idx}-${t.id || idx}` === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          reorderQueue(oldIndex, newIndex);
        }
      }
    }
  };

  const handleSaveAsPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = playlistName.trim() || `Queue - ${new Date().toLocaleDateString()}`;
    const allTracks = [...userQueue, ...queue];
    const trackIds = allTracks.map((t) => t.id).filter((id): id is number => typeof id === 'number');

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

  // Calculate total playlist duration and total track count
  const totalQueueSeconds = queue.reduce((acc, t) => acc + (t.duration || 0), 0) + userQueue.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalQueueCount = queue.length + userQueue.length;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md h-full bg-[#080c10] border-l border-[#17232e] flex flex-col shadow-2xl p-5 overflow-hidden animate-in slide-in-from-right duration-300 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#17232e]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Play Queue</h2>
              {totalQueueSeconds > 0 && (
                <p className="text-[10px] text-slate-500 font-mono">
                  {formatDuration(totalQueueSeconds)} • {totalQueueCount} tracks
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeTab === 'queue' && totalQueueCount > 0 && (
              <button
                onClick={() => setIsSavingPlaylist(!isSavingPlaylist)}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-emerald-300 px-2 py-1 rounded-lg bg-[#101822] border border-[#1e2d3e] hover:border-emerald-500/40 transition-colors"
                title="Save tracklist as playlist"
              >
                <Disc className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium">Save</span>
              </button>
            )}

            {activeTab === 'queue' && queue.length > 1 && (
              <button
                onClick={shuffleQueue}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-[#101822] border border-transparent hover:border-[#1e2d3e] transition-colors"
                title="Shuffle queue"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            )}

            {activeTab === 'queue' && (queue.length > 0 || userQueue.length > 0) && (
              <button
                onClick={() => {
                  clearQueue();
                  clearUserQueue();
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Clear
              </button>
            )}

            {activeTab === 'history' && history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Clear History
              </button>
            )}

            <button
              onClick={() => setQueueOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Up Next vs History */}
        <div className="flex items-center gap-1 p-1 my-3 bg-[#0d131a] rounded-xl border border-[#17232e]">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Tracklist</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121c27] text-slate-300 font-mono">
              {totalQueueCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#121c27] text-slate-300 font-mono">
              {history.length}
            </span>
          </button>
        </div>

        {/* Save As Playlist Inline Dialog */}
        {isSavingPlaylist && (
          <form onSubmit={handleSaveAsPlaylist} className="mb-3 p-3 rounded-2xl bg-[#0d141d] border border-emerald-500/40 space-y-2.5 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-emerald-400" />
                <span>Name this Playlist</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({totalQueueCount} tracks)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder={`e.g. Session ${new Date().toLocaleDateString()}`}
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
          <div className="mb-3 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            <span>Queue saved as new playlist!</span>
          </div>
        )}

        {/* Currently Playing Track Highlight */}
        {currentTrack && (
          <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-[#0c181f] to-[#121626] border border-emerald-500/30 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Now Playing
                </span>
              </div>

              <button
                onClick={togglePlay}
                className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-emerald-500/30">
                <CoverArt coverKey={currentTrack.coverKey} title={currentTrack.title} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-slate-100 truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-[#16222f] h-1 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab 1: Tracklist (User-Added Priority + Full Context Queue) */}
        {activeTab === 'queue' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {totalQueueCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <Music className="w-10 h-10 mb-2 opacity-25 text-emerald-400" />
                <p className="text-xs font-semibold text-slate-300">Queue is empty</p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-[220px]">
                  Play any song, album, or folder to load the full tracklist
                </p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQueueDragEnd}>
                {/* 1. Priority User-Queued Tracks (Play Next) */}
                {userQueue.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      <span>Next In Queue (User Added)</span>
                      <span className="font-mono text-[9px] text-cyan-500/80">{userQueue.length} priority</span>
                    </div>

                    <SortableContext
                      items={userQueue.map((t, idx) => `user-${idx}-${t.id || idx}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {userQueue.map((track, idx) => (
                        <SortableQueueItem
                          key={`user-${idx}-${track.id || idx}`}
                          track={track}
                          index={idx}
                          prefix="user"
                          onPlay={() => playUserQueueIndex(idx)}
                          onRemove={() => removeFromUserQueue(idx)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                )}

                {/* 2. Persistent Context Queue (Full Album / Folder / Playlist) */}
                {queue.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Playing From Context</span>
                      <span className="font-mono text-[9px] text-slate-600">
                        {currentIndex >= 0 ? `${currentIndex + 1} of ${queue.length}` : `${queue.length} tracks`}
                      </span>
                    </div>

                    <SortableContext
                      items={queue.map((t, idx) => `main-${idx}-${t.id || idx}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {queue.map((track, idx) => (
                        <SortableQueueItem
                          key={`main-${idx}-${track.id || idx}`}
                          track={track}
                          index={idx}
                          prefix="main"
                          isActive={idx === currentIndex}
                          isPast={currentIndex >= 0 && idx < currentIndex}
                          onPlay={() => playQueueIndex(idx)}
                          onRemove={() => removeFromQueue(idx)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                )}
              </DndContext>
            )}
          </div>
        )}

        {/* Tab 2: History (Recently Played in this session) */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <div className="flex items-center justify-between px-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Recently Played</span>
              {history.length > 0 && <span className="font-mono text-[10px] text-slate-600">{history.length} songs</span>}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <Clock className="w-10 h-10 mb-2 opacity-25 text-purple-400" />
                <p className="text-xs font-semibold text-slate-300">No session history yet</p>
                <p className="text-[11px] text-slate-600 mt-1">Tracks played during this session will appear here</p>
              </div>
            ) : (
              history.map((track, idx) => (
                <div
                  key={`hist-${idx}-${track.id}`}
                  className="group flex items-center gap-2.5 p-2 rounded-xl bg-[#090e14] border border-[#16222f] hover:border-purple-500/40 hover:bg-[#0d151e] transition-all text-xs"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#1b2a3a]">
                    <CoverArt coverKey={track.coverKey} title={track.title} size="sm" />
                  </div>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrack(track)}>
                    <p className="font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors leading-tight">
                      {track.title}
                    </p>
                    <p className="text-slate-400 truncate text-[11px] mt-0.5">{track.artist}</p>
                  </div>

                  <span className="text-slate-500 font-mono text-[11px] shrink-0">
                    {formatDuration(track.duration)}
                  </span>

                  <button
                    onClick={() => playTrack(track)}
                    className="p-1 rounded-md text-purple-400 hover:bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Replay track"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
