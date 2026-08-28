import React, { useState } from 'react';
import { Plus, Disc } from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';

interface AddToSubContextMenuProps {
  type: 'playlist' | 'folder';
  tracks: Track[];
  onSelect: () => void;
}

export const AddToSubContextMenu: React.FC<AddToSubContextMenuProps> = ({
  type,
  tracks,
  onSelect,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { playlists, addTracksToPlaylist, createPlaylist } = usePlaylists();
  const { folders, addTracksToFolder, createFolder } = useFolders('view', 'home');

  const trackIds = tracks.map((t) => t.id!).filter(Boolean);

  const handleSelectPlaylist = async (playlistId: number) => {
    await addTracksToPlaylist(playlistId, trackIds);
    onSelect();
  };

  const handleSelectFolder = async (folderId: number) => {
    await addTracksToFolder(folderId, trackIds);
    onSelect();
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
    onSelect();
  };

  const placeholder = type === 'playlist' ? 'New Playlist...' : 'New Folder...';

  return (
    <div
      className="w-52 bg-[#090d13] rounded-2xl p-1.5 shadow-2xl border border-[#17232e] text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Create New Inline Form or Button */}
      {isCreatingNew ? (
        <form onSubmit={handleCreateNew} className="p-1 space-y-1.5 border-b border-[#141d27] mb-1">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e141b] border border-[#1e2936] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsCreatingNew(true)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            type === 'playlist'
              ? 'text-purple-400 hover:bg-purple-500/15'
              : 'text-emerald-400 hover:bg-emerald-500/15'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New {type === 'playlist' ? 'Playlist...' : 'Folder...'}</span>
        </button>
      )}

      <div className="h-px bg-[#17232e] my-1" />

      {/* Existing Scrollable List */}
      <div className="space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar">
        {type === 'playlist' ? (
          playlists.length === 0 ? (
            <div className="text-center py-3 text-slate-500 text-[11px]">No playlists yet</div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleSelectPlaylist(pl.id!)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-purple-500/20 text-slate-300 hover:text-purple-200 transition-colors text-left group truncate"
              >
                <div className="flex items-center gap-2 truncate">
                  <Disc className="w-3.5 h-3.5 text-purple-400/70 group-hover:text-purple-400 shrink-0" />
                  <span className="text-xs truncate">{pl.name}</span>
                </div>
                <span className="text-[10px] text-purple-400/60 opacity-0 group-hover:opacity-100 font-mono transition-opacity ml-1 shrink-0">
                  +Add
                </span>
              </button>
            ))
          )
        ) : folders.length === 0 ? (
          <div className="text-center py-3 text-slate-500 text-[11px]">No folders yet</div>
        ) : (
          folders.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectFolder(f.id!)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-200 transition-colors text-left group truncate"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs shrink-0">{f.icon || '📁'}</span>
                <span className="text-xs truncate">{f.name}</span>
              </div>
              <span className="text-[10px] text-emerald-400/60 opacity-0 group-hover:opacity-100 font-mono transition-opacity ml-1 shrink-0">
                +Add
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
