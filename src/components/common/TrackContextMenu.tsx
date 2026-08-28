import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  ListPlus,
  Heart,
  Disc,
  FolderPlus,
  Edit2,
  Download,
  Trash2,
  Layers,
  FolderMinus,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { useMultiDeckStore } from '../../stores/multiDeckStore';
import { useFolders, useTrackFolderIds } from '../../hooks/useFolders';
import { db } from '../../db/db';
import { deleteFile, readBlob } from '../../db/opfs';
import { EditTrackMetadataModal } from '../library/EditTrackMetadataModal';
import { AddToSubContextMenu } from '../modals/AddToSubContextMenu';

interface TrackContextMenuProps {
  track: Track;
  children: React.ReactNode;
  onDeleted?: () => void;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  track,
  children,
  onDeleted,
}) => {
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [collectionModalType, setCollectionModalType] = useState<'playlist' | 'folder' | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { playTrack, addToQueue, playNext } = usePlayerStore();
  const { addDeck } = useMultiDeckStore();
  const { ungroupTracks } = useFolders('view', 'home');
  const assignedFolderIds = useTrackFolderIds(track.id);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Initial position calculation with safe margins
    const menuWidth = 230;
    const menuHeight = 360;
    const x = Math.max(10, Math.min(e.clientX, window.innerWidth - menuWidth - 10));
    const y = Math.max(10, Math.min(e.clientY, window.innerHeight - menuHeight - 10));
    setMenuPosition({ x, y });
  };

  useEffect(() => {
    if (menuPosition && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let adjustedX = menuPosition.x;
      let adjustedY = menuPosition.y;

      if (rect.bottom > window.innerHeight - 10) {
        adjustedY = Math.max(10, window.innerHeight - rect.height - 15);
      }
      if (rect.right > window.innerWidth - 10) {
        adjustedX = Math.max(10, window.innerWidth - rect.width - 15);
      }
      if (adjustedX !== menuPosition.x || adjustedY !== menuPosition.y) {
        setMenuPosition({ x: adjustedX, y: adjustedY });
      }
    }
  }, [menuPosition?.x, menuPosition?.y]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
      }
    };
    if (menuPosition) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuPosition]);

  const handleToggleFavorite = async () => {
    if (!track.id) return;
    await db.tracks.update(track.id, { isFavorite: !track.isFavorite });
    setMenuPosition(null);
  };

  const handleExportAudio = async () => {
    try {
      const blob = await readBlob(track.fileKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${track.artist} - ${track.title}.${track.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export audio file:', err);
    }
    setMenuPosition(null);
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
    setMenuPosition(null);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} className="w-full">
        {children}
      </div>

      {menuPosition && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.y, left: menuPosition.x }}
          className="fixed z-50 w-56 bg-[#090d13] rounded-2xl p-1.5 shadow-2xl border border-[#17232e] text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-visible"
        >
          {/* Primary Action Group */}
          <button
            onClick={() => {
              playTrack(track);
              setMenuPosition(null);
            }}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-emerald-500/15 hover:text-emerald-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-emerald-500/10 group-hover/btn:bg-emerald-500/20 group-hover/btn:scale-110 transition-all text-emerald-400">
                <Play className="w-3.5 h-3.5 fill-emerald-400" />
              </div>
              <span className="font-semibold text-xs">Play Now</span>
            </div>
            <span className="text-[10px] text-emerald-500/60 opacity-0 group-hover/btn:opacity-100 transition-opacity font-mono">↵</span>
          </button>

          <button
            onClick={() => {
              addDeck(track, true);
              setMenuPosition(null);
            }}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-teal-500/15 hover:text-teal-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-teal-500/10 group-hover/btn:bg-teal-500/20 group-hover/btn:scale-110 transition-all text-teal-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Play in Layer / Tab</span>
            </div>
            <span className="text-[10px] text-teal-500/60 opacity-0 group-hover/btn:opacity-100 transition-opacity font-mono">+Layer</span>
          </button>

          <button
            onClick={() => {
              playNext(track);
              setMenuPosition(null);
            }}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-cyan-500/15 hover:text-cyan-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-cyan-500/10 group-hover/btn:bg-cyan-500/20 group-hover/btn:scale-110 transition-all text-cyan-400">
                <Play className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Play Next</span>
            </div>
            <span className="text-[10px] text-cyan-500/60 opacity-0 group-hover/btn:opacity-100 transition-opacity font-mono">Next</span>
          </button>

          <button
            onClick={() => {
              addToQueue(track);
              setMenuPosition(null);
            }}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-indigo-500/15 hover:text-indigo-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-indigo-500/10 group-hover/btn:bg-indigo-500/20 group-hover/btn:scale-110 transition-all text-indigo-400">
                <ListPlus className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Add to Queue</span>
            </div>
            <span className="text-[10px] text-indigo-500/60 opacity-0 group-hover/btn:opacity-100 transition-opacity font-mono">+Queue</span>
          </button>

          {/* Edit Metadata option */}
          <button
            onClick={() => {
              setIsEditModalOpen(true);
              setMenuPosition(null);
            }}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-indigo-500/15 hover:text-indigo-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-indigo-500/10 group-hover/btn:bg-indigo-500/20 group-hover/btn:scale-110 transition-all text-indigo-400">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Edit Metadata</span>
            </div>
            <span className="text-[10px] text-indigo-500/60 opacity-0 group-hover/btn:opacity-100 transition-opacity font-mono">Tags</span>
          </button>

          <div className="h-px bg-[#17232e] my-1" />

          {/* Collection & Folder Actions Group */}
          <button
            onClick={handleToggleFavorite}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-rose-500/15 hover:text-rose-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-rose-500/10 group-hover/btn:bg-rose-500/20 group-hover/btn:scale-110 transition-all text-rose-400">
                <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`} />
              </div>
              <span className="font-medium text-xs">
                {track.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
              </span>
            </div>
            {track.isFavorite && (
              <span className="text-[10px] text-rose-400/70 font-mono">Saved</span>
            )}
          </button>

          {/* Add to Playlist Option with Side-by-Side Flyout */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollectionModalType(collectionModalType === 'playlist' ? null : 'playlist');
              }}
              className={`group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                collectionModalType === 'playlist'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-transparent hover:bg-purple-500/15 hover:text-purple-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-purple-500/10 group-hover/btn:bg-purple-500/20 group-hover/btn:scale-110 transition-all text-purple-400">
                  <Disc className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-xs">Add to Playlist</span>
              </div>
              <span className={`text-[10px] text-slate-500 transition-colors ${collectionModalType === 'playlist' ? 'text-purple-400 font-bold' : ''}`}>
                ▶
              </span>
            </button>

            {collectionModalType === 'playlist' && (
              <div
                className={`absolute ${
                  menuPosition.x + 224 + 215 > window.innerWidth ? 'right-full mr-1.5' : 'left-full ml-1.5'
                } top-0 z-50`}
              >
                <AddToSubContextMenu
                  type="playlist"
                  tracks={[track]}
                  onSelect={() => setMenuPosition(null)}
                />
              </div>
            )}
          </div>

          {/* Add to Folder Option with Side-by-Side Flyout */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollectionModalType(collectionModalType === 'folder' ? null : 'folder');
              }}
              className={`group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                collectionModalType === 'folder'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-transparent hover:bg-emerald-500/15 hover:text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-emerald-500/10 group-hover/btn:bg-emerald-500/20 group-hover/btn:scale-110 transition-all text-emerald-400">
                  <FolderPlus className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-xs">Add to Folder</span>
              </div>
              <span className={`text-[10px] text-slate-500 transition-colors ${collectionModalType === 'folder' ? 'text-emerald-400 font-bold' : ''}`}>
                ▶
              </span>
            </button>

            {collectionModalType === 'folder' && (
              <div
                className={`absolute ${
                  menuPosition.x + 224 + 215 > window.innerWidth ? 'right-full mr-1.5' : 'left-full ml-1.5'
                } top-0 z-50`}
              >
                <AddToSubContextMenu
                  type="folder"
                  tracks={[track]}
                  onSelect={() => setMenuPosition(null)}
                />
              </div>
            )}
          </div>

          {/* Remove from folder / Ungroup if assigned */}
          {assignedFolderIds && assignedFolderIds.length > 0 && (
            <button
              onClick={() => {
                if (track.id) {
                  ungroupTracks([track.id]);
                }
                setMenuPosition(null);
              }}
              className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-amber-500/15 hover:text-amber-300 transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-amber-500/10 group-hover/btn:bg-amber-500/20 group-hover/btn:scale-110 transition-all text-amber-400">
                  <FolderMinus className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-xs">Ungroup from Folders</span>
              </div>
              <span className="text-[10px] text-amber-500/60 font-mono">Unlink</span>
            </button>
          )}

          <div className="h-px bg-[#17232e] my-1" />

          {/* Export and Delete actions */}
          <button
            onClick={handleExportAudio}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-cyan-500/15 hover:text-cyan-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-cyan-500/10 group-hover/btn:bg-cyan-500/20 group-hover/btn:scale-110 transition-all text-cyan-400">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-xs">Export Audio File</span>
            </div>
          </button>

          <button
            onClick={handleDelete}
            className="group/btn w-full flex items-center justify-between px-3 py-2 rounded-xl bg-transparent hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-rose-500/10 group-hover/btn:bg-rose-500/20 group-hover/btn:scale-110 transition-all text-rose-400">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs">Delete Track</span>
            </div>
          </button>
        </div>
      )}

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
