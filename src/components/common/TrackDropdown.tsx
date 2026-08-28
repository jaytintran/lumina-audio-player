import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  ListPlus,
  Play,
  FolderPlus,
  Trash2,
  Heart,
  Disc,
  Edit2,
  Layers,
  FolderMinus,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { useMultiDeckStore } from '../../stores/multiDeckStore';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders, useTrackFolderIds } from '../../hooks/useFolders';
import { db } from '../../db/db';
import { deleteFile } from '../../db/opfs';
import { EditTrackMetadataModal } from '../library/EditTrackMetadataModal';

interface TrackDropdownProps {
  track: Track;
  onDeleted?: () => void;
}

export const TrackDropdown: React.FC<TrackDropdownProps> = ({ track, onDeleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylistsSub, setShowPlaylistsSub] = useState(false);
  const [showFoldersSub, setShowFoldersSub] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const { addToQueue, playNext, playTrack } = usePlayerStore();
  const { addDeck } = useMultiDeckStore();
  const { playlists, addTracksToPlaylist } = usePlaylists();
  const { folders, addTracksToFolder, ungroupTracks } = useFolders('view', 'home');
  const assignedFolderIds = useTrackFolderIds(track.id);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const estimatedMenuHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 320px below button, flip upward (dropup)
      setOpenUpward(spaceBelow < estimatedMenuHeight);
    }
    setIsOpen(!isOpen);
    setShowPlaylistsSub(false);
    setShowFoldersSub(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPlaylistsSub(false);
        setShowFoldersSub(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleFavorite = async () => {
    if (!track.id) return;
    await db.tracks.update(track.id, { isFavorite: !track.isFavorite });
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!track.id) return;
    if (confirm(`Remove "${track.title}" from library?`)) {
      await db.tracks.delete(track.id);
      await db.trackPlaylists.where('trackId').equals(track.id).delete();
      await db.trackFolders.where('trackId').equals(track.id).delete();
      if (track.fileKey) await deleteFile(track.fileKey);
      if (track.coverKey) await deleteFile(track.coverKey);
      onDeleted?.();
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={toggleDropdown}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          title="More actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div
            ref={menuContainerRef}
            className={`absolute right-0 ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } w-52 z-50 bg-[#090d13] rounded-2xl p-1.5 shadow-2xl border border-[#17232e] text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] overflow-y-auto custom-scrollbar`}
          >
            {/* Play Actions Group */}
            <button
              onClick={() => {
                playTrack(track);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-500/15 hover:text-emerald-300 rounded-xl transition-colors text-left"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span className="font-semibold">Play Now</span>
            </button>

            <button
              onClick={() => {
                addDeck(track, true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-teal-500/15 hover:text-teal-300 rounded-xl transition-colors text-left"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Play in Layer / Tab</span>
            </button>

            <button
              onClick={() => {
                playNext(track);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cyan-500/15 hover:text-cyan-300 rounded-xl transition-colors text-left"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Play Next</span>
            </button>

            <button
              onClick={() => {
                addToQueue(track);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-500/15 hover:text-indigo-300 rounded-xl transition-colors text-left"
            >
              <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add to Queue</span>
            </button>

            {/* Edit Metadata in the primary group */}
            <button
              onClick={() => {
                setIsEditModalOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-500/15 hover:text-indigo-300 rounded-xl transition-colors text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Metadata</span>
            </button>

            <div className="h-px bg-[#17232e] my-1" />

            <button
              onClick={handleToggleFavorite}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-500/15 hover:text-rose-300 rounded-xl transition-colors text-left"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  track.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-rose-400'
                }`}
              />
              <span>{track.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
            </button>

            {/* Add to Playlist Submenu */}
            <div className="relative">
              <button
                onClick={() => setShowPlaylistsSub(!showPlaylistsSub)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl transition-colors text-left"
              >
                <span className="flex items-center gap-2.5">
                  <Disc className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add to Playlist</span>
                </span>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>

              {showPlaylistsSub && (
                <div
                  className={`absolute right-full ${
                    openUpward ? 'bottom-0' : 'top-0'
                  } mr-1 w-44 bg-[#090d13] rounded-xl py-1 shadow-2xl border border-[#17232e] max-h-48 overflow-y-auto custom-scrollbar`}
                >
                  {playlists.length === 0 ? (
                    <div className="px-3 py-2 text-slate-500 text-[11px]">No playlists yet</div>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => {
                          if (track.id && pl.id) {
                            addTracksToPlaylist(pl.id, [track.id]);
                          }
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-purple-500/20 hover:text-purple-300 rounded-lg truncate"
                      >
                        {pl.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Add to Folder Submenu */}
            <div className="relative">
              <button
                onClick={() => setShowFoldersSub(!showFoldersSub)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl transition-colors text-left"
              >
                <span className="flex items-center gap-2.5">
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add to Folder</span>
                </span>
                <span className="text-[10px] text-slate-500">▶</span>
              </button>

              {showFoldersSub && (
                <div
                  className={`absolute right-full ${
                    openUpward ? 'bottom-0' : 'top-0'
                  } mr-1 w-44 bg-[#090d13] rounded-xl py-1 shadow-2xl border border-[#17232e] max-h-48 overflow-y-auto custom-scrollbar`}
                >
                  {folders.length === 0 ? (
                    <div className="px-3 py-2 text-slate-500 text-[11px]">No folders yet</div>
                  ) : (
                    folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (track.id && f.id) {
                            addTracksToFolder(f.id, [track.id]);
                          }
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-emerald-300 rounded-lg truncate flex items-center gap-1.5"
                      >
                        <span>{f.icon || '📁'}</span>
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Ungroup option if in folder */}
            {assignedFolderIds && assignedFolderIds.length > 0 && (
              <button
                onClick={() => {
                  if (track.id) {
                    ungroupTracks([track.id]);
                  }
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-amber-500/20 text-amber-400/90 hover:text-amber-300 rounded-xl transition-colors text-left"
              >
                <FolderMinus className="w-3.5 h-3.5 text-amber-400" />
                <span>Ungroup from Folders</span>
              </button>
            )}

            <div className="h-px bg-[#17232e] my-1" />

            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Track</span>
            </button>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EditTrackMetadataModal
          track={track}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};
