import React, { useState } from 'react';
import { X, Plus, Disc, FolderPlus } from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';

interface AddToCollectionModalProps {
  type: 'playlist' | 'folder';
  tracks: Track[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  type,
  tracks,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { playlists, addTracksToPlaylist, createPlaylist } = usePlaylists();
  const { folders, addTracksToFolder, createFolder } = useFolders('view', 'home');

  if (!isOpen) return null;

  const trackIds = tracks.map((t) => t.id!).filter(Boolean);

  const handleSelectPlaylist = async (playlistId: number) => {
    await addTracksToPlaylist(playlistId, trackIds);
    onSuccess?.();
    onClose();
  };

  const handleSelectFolder = async (folderId: number) => {
    await addTracksToFolder(folderId, trackIds);
    onSuccess?.();
    onClose();
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (type === 'playlist') {
      const newId = await createPlaylist(newTitle.trim());
      await addTracksToPlaylist(Number(newId), trackIds);
    } else {
      const newId = await createFolder(newTitle.trim(), '📁');
      await addTracksToFolder(Number(newId), trackIds);
    }

    setNewTitle('');
    setIsCreatingNew(false);
    onSuccess?.();
    onClose();
  };

  const titleText = type === 'playlist' ? 'Add to Playlist' : 'Add to Folder';
  const newPlaceholder = type === 'playlist' ? 'New Playlist Name...' : 'New Folder Name...';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#090d12] border border-[#17232e] rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#141d27] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                type === 'playlist'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {type === 'playlist' ? <Disc className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{titleText}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tracks.length === 1 ? `"${tracks[0].title}"` : `${tracks.length} Tracks selected`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#141d27] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create New Inline Form */}
        {isCreatingNew ? (
          <form onSubmit={handleCreateNew} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={newPlaceholder}
              className="flex-1 px-3 py-2 rounded-xl bg-[#0e141b] border border-[#1e2936] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-2.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingNew(true)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed text-xs font-semibold transition-all ${
              type === 'playlist'
                ? 'border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/60'
                : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create New {type === 'playlist' ? 'Playlist' : 'Folder'}</span>
          </button>
        )}

        {/* Existing List */}
        <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {type === 'playlist' ? (
            playlists.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No playlists created yet</div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleSelectPlaylist(pl.id!)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#121922] text-slate-200 hover:text-purple-300 border border-transparent hover:border-[#1e2a38] transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Disc className="w-4 h-4 text-purple-400/70 group-hover:text-purple-400 shrink-0" />
                    <span className="text-xs font-medium truncate">{pl.name}</span>
                  </div>
                  <span className="text-[10px] text-purple-400/60 opacity-0 group-hover:opacity-100 font-mono transition-opacity">
                    +Add
                  </span>
                </button>
              ))
            )
          ) : folders.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">No folders created yet</div>
          ) : (
            folders.map((f) => (
              <button
                key={f.id}
                onClick={() => handleSelectFolder(f.id!)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#121922] text-slate-200 hover:text-emerald-300 border border-transparent hover:border-[#1e2a38] transition-all text-left group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-sm shrink-0">{f.icon || '📁'}</span>
                  <span className="text-xs font-medium truncate">{f.name}</span>
                </div>
                <span className="text-[10px] text-emerald-400/60 opacity-0 group-hover:opacity-100 font-mono transition-opacity">
                  +Add
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
