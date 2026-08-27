import React, { useState } from 'react';
import {
  ListPlus,
  Heart,
  Trash2,
  X,
  Disc,
  CheckSquare,
  Edit3,
  Tag,
  Music,
  User,
  Check,
  FolderMinus,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';
import { db } from '../../db/db';
import { deleteFile } from '../../db/opfs';

interface BulkActionBarProps {
  selectedTrackIds: Set<number>;
  allTracks: Track[];
  onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedTrackIds,
  allTracks,
  onClearSelection,
}) => {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkArtist, setBulkArtist] = useState('');
  const [bulkGenre, setBulkGenre] = useState('');
  const [bulkTags, setBulkTags] = useState('');

  const { addToQueue, currentTrack } = usePlayerStore();
  const { playlists, addTracksToPlaylist } = usePlaylists();
  const { ungroupTracks } = useFolders('view', 'home');

  if (selectedTrackIds.size === 0) return null;

  const selectedTracks = allTracks.filter((t) => t.id && selectedTrackIds.has(t.id));
  const selectedIdsArray = Array.from(selectedTrackIds);

  const handleBulkAddToQueue = () => {
    addToQueue(selectedTracks);
    onClearSelection();
  };

  const handleBulkUngroup = async () => {
    await ungroupTracks(selectedIdsArray);
    onClearSelection();
  };

  const handleBulkFavorite = async () => {
    for (const id of selectedIdsArray) {
      await db.tracks.update(id, { isFavorite: true });
    }
    onClearSelection();
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIdsArray.length} tracks from library?`)) {
      for (const track of selectedTracks) {
        if (track.id) {
          await db.tracks.delete(track.id);
          await db.trackPlaylists.where('trackId').equals(track.id).delete();
          await db.trackFolders.where('trackId').equals(track.id).delete();
          if (track.fileKey) await deleteFile(track.fileKey);
          if (track.coverKey) await deleteFile(track.coverKey);
        }
      }
      onClearSelection();
    }
  };

  const handleSaveBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Track> = {};
    if (bulkArtist.trim()) {
      updates.artist = bulkArtist.trim();
    }
    if (bulkGenre.trim()) {
      updates.genre = bulkGenre.trim();
    }
    if (bulkTags.trim()) {
      const parsedTags = bulkTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (parsedTags.length > 0) {
        updates.tags = parsedTags;
      }
    }

    if (Object.keys(updates).length > 0) {
      for (const id of selectedIdsArray) {
        await db.tracks.update(id, updates);
      }
    }

    setIsBulkEditOpen(false);
    onClearSelection();
  };

  // Position above the player bar if active (bottom-24), otherwise bottom-6
  const bottomPosition = currentTrack ? 'bottom-24' : 'bottom-6';

  const hasAnyInput = Boolean(bulkArtist.trim() || bulkGenre.trim() || bulkTags.trim());

  return (
    <>
      <div
        className={`fixed ${bottomPosition} left-1/2 -translate-x-1/2 z-40 bg-[#0c1218]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#1e2a38] shadow-2xl shadow-black/80 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 text-xs select-none`}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-[#17232e]">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-100 whitespace-nowrap">
            {selectedTrackIds.size} Selected
          </span>
        </div>

        {/* Bulk Edit Metadata Button */}
        <button
          onClick={() => {
            setBulkArtist('');
            setBulkGenre('');
            setBulkTags('');
            setIsBulkEditOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-[#1a2634] hover:text-emerald-300 text-slate-200 border border-[#1e2a38] transition-colors whitespace-nowrap"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Edit Metadata</span>
        </button>

        {/* Add to Queue */}
        <button
          onClick={handleBulkAddToQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-[#1a2634] hover:text-slate-100 text-slate-300 border border-[#1e2a38] transition-colors whitespace-nowrap"
        >
          <ListPlus className="w-3.5 h-3.5 text-slate-400" />
          <span>Queue</span>
        </button>

        {/* Add to Playlist Popup */}
        <div className="relative">
          <button
            onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-[#1a2634] hover:text-slate-100 text-slate-300 border border-[#1e2a38] transition-colors whitespace-nowrap"
          >
            <Disc className="w-3.5 h-3.5 text-purple-400" />
            <span>Playlist</span>
          </button>

          {showPlaylistMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#0d131a] rounded-xl py-1 shadow-2xl border border-[#1e2a38] max-h-48 overflow-y-auto">
              {playlists.length === 0 ? (
                <div className="px-3 py-2 text-slate-500 text-[11px]">No playlists created</div>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (pl.id) {
                        addTracksToPlaylist(pl.id, selectedIdsArray);
                        setShowPlaylistMenu(false);
                        onClearSelection();
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#151f2b] hover:text-emerald-300 text-slate-300 truncate transition-colors text-xs"
                  >
                    {pl.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={handleBulkFavorite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-[#1a2634] hover:text-rose-300 text-slate-300 border border-[#1e2a38] transition-colors whitespace-nowrap"
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Favorite</span>
        </button>

        {/* Ungroup from Folders */}
        <button
          onClick={handleBulkUngroup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-amber-950/40 hover:text-amber-300 text-slate-300 border border-[#1e2a38] transition-colors whitespace-nowrap"
          title="Remove selected tracks from any folders"
        >
          <FolderMinus className="w-3.5 h-3.5 text-amber-400" />
          <span>Ungroup</span>
        </button>

        {/* Delete */}
        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-rose-950/40 hover:text-rose-400 text-rose-400/80 border border-rose-900/30 transition-colors whitespace-nowrap"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#141d27] transition-colors ml-1"
          title="Deselect all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bulk Edit Modal */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#090d12] border border-[#17232e] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#141d27] pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  Bulk Edit ({selectedTrackIds.size} Tracks)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Any field you fill in will update all selected tracks
                </p>
              </div>
              <button
                onClick={() => setIsBulkEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#141d27]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkEdit} className="space-y-3.5">
              {/* Batch Artist Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Artist</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={bulkArtist}
                  onChange={(e) => setBulkArtist(e.target.value)}
                  placeholder="Leave blank to keep unchanged..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0e141b] border border-[#1e2936] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Batch Genre Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Genre</span>
                </label>
                <input
                  type="text"
                  value={bulkGenre}
                  onChange={(e) => setBulkGenre(e.target.value)}
                  placeholder="e.g. Ambient, Lo-Fi, Classical..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0e141b] border border-[#1e2936] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Batch Tags Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Category Tags (comma separated)</span>
                </label>
                <input
                  type="text"
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  placeholder="e.g. Study, Chill, Instrumental..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0e141b] border border-[#1e2936] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#141d27]">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#1e2936] text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#141d27] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasAnyInput}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
