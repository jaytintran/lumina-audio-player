import React, { useState } from 'react';
import {
  Play,
  Shuffle,
  Plus,
  ArrowUpDown,
  Music,
  Globe,
  ExternalLink,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { useFolders, useAllFolderTrackIds } from '../../hooks/useFolders';
import { useSources } from '../../hooks/useSources';
import { usePlayerStore } from '../../stores/playerStore';
import { useDroppable } from '@dnd-kit/core';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import { FolderSection } from '../library/FolderSection';
import { BulkActionBar } from '../library/BulkActionBar';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { getFolderIconComponent } from '../../utils/folderIcons';

interface LibraryViewProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  tracks: Track[];
  viewMode: 'grid' | 'row';
  density: 'compact' | 'comfortable';
  scopeId?: string;
  sortBy: 'order' | 'title' | 'artist' | 'dateAdded' | 'playCount';
  onSortChange: (sort: 'order' | 'title' | 'artist' | 'dateAdded' | 'playCount') => void;
  sortDesc: boolean;
  onSortDescToggle: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  title,
  subtitle,
  icon: Icon = Music,
  iconColor = 'text-emerald-400',
  tracks,
  viewMode,
  density,
  scopeId = 'home',
  sortBy,
  onSortChange,
  sortDesc,
  onSortDescToggle,
}) => {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const hideGroupedTracks = settings?.hideGroupedTracks ?? false;

  const { folders, createFolder } = useFolders('view', scopeId);
  const folderTrackIds = useAllFolderTrackIds() || new Set<number>();
  const { sources, addSource } = useSources();
  const { playTrack } = usePlayerStore();

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<number>>(new Set());

  const { setNodeRef: setUngroupRef, isOver: isOverUngroup } = useDroppable({
    id: 'ungroup-drop-zone',
  });

  const handleToggleHideGrouped = () => {
    updateSettings.mutate({ hideGroupedTracks: !hideGroupedTracks });
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSourceTitle.trim() && newSourceUrl.trim()) {
      await addSource(newSourceTitle.trim(), newSourceUrl.trim());
      setNewSourceTitle('');
      setNewSourceUrl('');
      setIsAddingSource(false);
    }
  };

  const displayedTracks = hideGroupedTracks
    ? tracks.filter((t) => t.id && !folderTrackIds.has(t.id))
    : tracks;

  const handlePlayAll = () => {
    if (displayedTracks.length > 0) {
      playTrack(displayedTracks[0], displayedTracks);
    }
  };

  const handleShuffleAll = () => {
    if (displayedTracks.length > 0) {
      const shuffled = [...displayedTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleSelectTrack = (trackId: number, _e?: React.MouseEvent) => {
    const newSet = new Set(selectedTrackIds);
    if (newSet.has(trackId)) {
      newSet.delete(trackId);
    } else {
      newSet.add(trackId);
    }
    setSelectedTrackIds(newSet);
  };

  const handleLongPressSelect = (trackId: number) => {
    const newSet = new Set(selectedTrackIds);
    newSet.add(trackId);
    setSelectedTrackIds(newSet);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Download Sources Box matching screenshot design */}
      <div className="p-4 rounded-xl bg-[#090d12] border border-[#141d27]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Download Sources</span>
          </div>

          <button
            onClick={() => setIsAddingSource(!isAddingSource)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e141b] border border-[#1e2936] hover:border-[#2d3d50] text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Source</span>
          </button>
        </div>

        {/* Source Link Pills matching screenshot */}
        <div className="flex flex-wrap items-center gap-2">
          {sources.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111720] border border-[#1c2734] hover:border-[#2b3a4c] hover:bg-[#151e2a] text-xs font-medium text-slate-200 transition-colors"
            >
              <span>{s.title}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          ))}
        </div>

        {/* Add Source Input Form */}
        {isAddingSource && (
          <form
            onSubmit={handleCreateSource}
            className="mt-3 flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#0d131a] border border-emerald-500/40 animate-in slide-in-from-top duration-150"
          >
            <input
              type="text"
              autoFocus
              placeholder="Source Name (e.g. Bandcamp, Archive.org)"
              value={newSourceTitle}
              onChange={(e) => setNewSourceTitle(e.target.value)}
              className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-[#080c10] border border-[#1c2734] text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="URL (e.g. https://bandcamp.com)"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-[#080c10] border border-[#1c2734] text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAddingSource(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* 2. Folders Row matching screenshot design */}
      <div className="flex flex-wrap items-center gap-2">
        {folders.map((f) => {
          const PillIconComp = getFolderIconComponent(f.icon);
          return (
            <div
              key={f.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#141d27] hover:border-emerald-500/50 text-xs text-slate-300 transition-colors cursor-pointer select-none"
            >
              <PillIconComp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{f.name}</span>
            </div>
          );
        })}

        <button
          onClick={() => setIsAddingFolder(!isAddingFolder)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#141d27] hover:border-slate-600 text-xs text-slate-400 hover:text-slate-200 transition-colors select-none"
        >
          <Plus className="w-3 h-3" />
          <span>Folder</span>
        </button>
      </div>

      {/* Add Folder Inline Input Form */}
      {isAddingFolder && (
        <form
          onSubmit={handleCreateFolder}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090d12] border border-emerald-500/50 animate-in slide-in-from-top duration-150 max-w-md"
        >
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name (e.g. Focus & Ambient, Chill)..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-[#0e141b] border border-[#1e2936] text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsAddingFolder(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* View Header & Action Bar */}
      <div
        ref={setUngroupRef}
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2 rounded-2xl transition-all duration-200 ${
          isOverUngroup
            ? 'bg-amber-950/20 border border-amber-500/50 ring-2 ring-amber-500/30'
            : ''
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            <h1 className="text-lg md:text-xl font-extrabold text-slate-100 tracking-tight">
              {title}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#0d1218] text-slate-400 border border-[#17232e]">
              {tracks.length}
            </span>
            {isOverUngroup && (
              <span className="text-[11px] font-bold text-amber-400 animate-pulse bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/40">
                Drop to Ungroup
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {tracks.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10b981] text-[#041f14] font-bold text-xs hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShuffleAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0d1218] border border-[#17232e] text-slate-300 hover:text-slate-100 text-xs font-semibold transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shuffle</span>
              </button>
            </>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-[#0d1218] border border-[#17232e] rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="order" className="bg-[#0d1218] text-slate-200">Custom Order</option>
              <option value="title" className="bg-[#0d1218] text-slate-200">Title</option>
              <option value="artist" className="bg-[#0d1218] text-slate-200">Artist</option>
              <option value="dateAdded" className="bg-[#0d1218] text-slate-200">Date Added</option>
              <option value="playCount" className="bg-[#0d1218] text-slate-200">Most Played</option>
            </select>
            <button
              onClick={onSortDescToggle}
              className="ml-1 text-[10px] font-mono text-emerald-400 hover:underline"
            >
              {sortDesc ? 'DESC' : 'ASC'}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Folders Content */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Folders ({folders.length})
          </h2>
          {folders.map((folder) => (
            <FolderSection
              key={folder.id}
              folder={folder}
              viewMode={viewMode}
              density={density}
              selectedIds={selectedTrackIds}
              onSelectTrack={handleSelectTrack}
              onLongPressSelect={handleLongPressSelect}
            />
          ))}
        </div>
      )}

      {/* Main Track Collection */}
      <div>
        {folders.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              All Songs ({displayedTracks.length})
            </h2>

            {/* Toggle Button for Grouped Tracks Visibility */}
            <button
              onClick={handleToggleHideGrouped}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                hideGroupedTracks
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-sm'
                  : 'bg-[#0d1218] border-[#17232e] text-slate-400 hover:text-slate-200'
              }`}
              title={
                hideGroupedTracks
                  ? 'Showing only ungrouped audio (grouped in folders are hidden)'
                  : 'Showing all audio (including tracks grouped in folders)'
              }
            >
              {hideGroupedTracks ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hide Grouped</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Show All</span>
                </>
              )}
            </button>
          </div>
        )}

        {viewMode === 'grid' ? (
          <TrackGrid
            tracks={displayedTracks}
            selectedIds={selectedTrackIds}
            onSelectTrack={handleSelectTrack}
            onLongPressSelect={handleLongPressSelect}
          />
        ) : (
          <TrackRowList
            tracks={displayedTracks}
            density={density}
            selectedIds={selectedTrackIds}
            onSelectTrack={handleSelectTrack}
            onLongPressSelect={handleLongPressSelect}
          />
        )}
      </div>

      {/* Floating Multi-Select Bulk Action Bar */}
      <BulkActionBar
        selectedTrackIds={selectedTrackIds}
        allTracks={tracks}
        onClearSelection={() => setSelectedTrackIds(new Set())}
      />
    </div>
  );
};
