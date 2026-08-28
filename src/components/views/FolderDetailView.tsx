import React, { useState } from 'react';
import { Play, ArrowLeft, Trash2, Edit2, Shuffle } from 'lucide-react';
import { useFolders, useFolderTracks } from '../../hooks/useFolders';
import { usePlayerStore } from '../../stores/playerStore';
import { getFolderIconComponent } from '../../utils/folderIcons';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import { BulkActionBar } from '../library/BulkActionBar';

interface FolderDetailViewProps {
  folderId: number;
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
  onBack: () => void;
}

export const FolderDetailView: React.FC<FolderDetailViewProps> = ({
  folderId,
  viewMode = 'grid',
  density = 'comfortable',
  onBack,
}) => {
  const { folders, updateFolder, deleteFolder } = useFolders('view', 'home');
  const folder = folders.find((f) => f.id === folderId);
  const tracks = useFolderTracks(folderId) || [];
  const { playTrack } = usePlayerStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(folder?.name || '');
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<number>>(new Set());

  if (!folder) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Folder not found</p>
        <button onClick={onBack} className="mt-4 text-xs text-emerald-400 hover:underline">
          Return to library
        </button>
      </div>
    );
  }

  const FolderIconComp = getFolderIconComponent(folder.icon);

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== folder.name) {
      await updateFolder(folderId, { name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffleAll = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleSelectTrack = (trackId: number, e?: React.MouseEvent) => {
    const newSet = new Set(selectedTrackIds);
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      if (newSet.has(trackId)) newSet.delete(trackId);
      else newSet.add(trackId);
    } else {
      if (newSet.has(trackId)) newSet.delete(trackId);
      else newSet.add(trackId);
    }
    setSelectedTrackIds(newSet);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Back & Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-[#121c27] px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-[#1e2a38]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          {tracks.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All</span>
              </button>
              <button
                onClick={handleShuffleAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1218] border border-[#17232e] text-slate-300 hover:text-slate-100 text-xs font-semibold transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shuffle</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (confirm(`Delete folder "${folder.name}"?`)) {
                deleteFolder(folderId);
                onBack();
              }
            }}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            title="Delete Folder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder Banner Header */}
      <div className="flex items-center gap-4 p-6 rounded-3xl bg-[#090d13] border border-[#17232e] shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#121d28] border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
          <FolderIconComp className="w-8 h-8 text-emerald-400" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Folder Section
          </span>

          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              onBlur={handleSaveTitle}
              className="w-full bg-[#0e1620] border border-emerald-500/60 rounded-xl px-2.5 py-1 font-extrabold text-xl text-slate-100 focus:outline-none mt-0.5"
            />
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <h2
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEditedTitle(folder.name);
                  setIsEditingTitle(true);
                }}
                className="text-xl md:text-2xl font-extrabold text-slate-100 truncate cursor-pointer hover:text-emerald-300 transition-colors"
                title="Right-click to edit name"
              >
                {folder.name}
              </h2>
              <button
                onClick={() => {
                  setEditedTitle(folder.name);
                  setIsEditingTitle(true);
                }}
                className="p-1 text-slate-500 hover:text-slate-300"
                title="Edit name"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400 font-mono mt-1">
            {tracks.length} track{tracks.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Tracks Container */}
      {viewMode === 'grid' ? (
        <TrackGrid
          tracks={tracks}
          selectedIds={selectedTrackIds}
          onSelectTrack={handleSelectTrack}
        />
      ) : (
        <TrackRowList
          tracks={tracks}
          density={density}
          selectedIds={selectedTrackIds}
          onSelectTrack={handleSelectTrack}
        />
      )}

      {/* Multi-Select Action Bar */}
      <BulkActionBar
        selectedTrackIds={selectedTrackIds}
        allTracks={tracks}
        onClearSelection={() => setSelectedTrackIds(new Set())}
      />
    </div>
  );
};
