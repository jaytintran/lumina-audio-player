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
  Plus,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';
import { db } from '../../db/db';
import { deleteFile, readBlob } from '../../db/opfs';
import { EditTrackMetadataModal } from '../library/EditTrackMetadataModal';

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
  const [showPlaylistsSub, setShowPlaylistsSub] = useState(false);
  const [showFoldersSub, setShowFoldersSub] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { playTrack, addToQueue, playNext } = usePlayerStore();
  const { playlists, addTracksToPlaylist, createPlaylist } = usePlaylists();
  const { folders, addTracksToFolder } = useFolders('view', 'home');

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Position menu within viewport bounds
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 340);
    setMenuPosition({ x, y });
    setShowPlaylistsSub(false);
    setShowFoldersSub(false);
  };

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

  const handleCreateAndAddToPlaylist = async () => {
    const name = prompt('New Playlist Name:');
    if (name && name.trim() && track.id) {
      const newId = await createPlaylist(name.trim());
      await addTracksToPlaylist(Number(newId), [track.id]);
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
          className="fixed z-50 w-56 glass-dropdown rounded-2xl p-1.5 shadow-2xl border border-border/80 text-xs text-foreground animate-in fade-in zoom-in-95 duration-150"
        >
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

          <div className="h-px bg-border my-1" />

          <button
            onClick={handleToggleFavorite}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/20 hover:text-rose-300 transition-colors text-left"
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
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                <Disc className="w-3.5 h-3.5 text-purple-400" />
                <span>Add to Playlist</span>
              </span>
              <span className="text-[10px] text-muted-foreground">▶</span>
            </button>

            {showPlaylistsSub && (
              <div className="absolute left-full top-0 ml-1 w-48 glass-dropdown rounded-2xl p-1 shadow-2xl border border-border max-h-48 overflow-y-auto">
                <button
                  onClick={handleCreateAndAddToPlaylist}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-primary hover:bg-primary/15 rounded-lg font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Playlist...</span>
                </button>
                <div className="h-px bg-border my-1" />
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (track.id && pl.id) {
                        addTracksToPlaylist(pl.id, [track.id]);
                      }
                      setMenuPosition(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-purple-500/20 hover:text-purple-300 rounded-lg truncate"
                  >
                    {pl.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Move to Folder Submenu */}
          <div className="relative">
            <button
              onClick={() => setShowFoldersSub(!showFoldersSub)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add to Section</span>
              </span>
              <span className="text-[10px] text-muted-foreground">▶</span>
            </button>

            {showFoldersSub && (
              <div className="absolute left-full top-0 ml-1 w-48 glass-dropdown rounded-2xl p-1 shadow-2xl border border-border max-h-48 overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="px-3 py-2 text-muted-foreground text-[11px]">No sections created</div>
                ) : (
                  folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        if (track.id && f.id) {
                          addTracksToFolder(f.id, [track.id]);
                        }
                        setMenuPosition(null);
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

          <div className="h-px bg-border my-1" />

          <button
            onClick={() => {
              setIsEditModalOpen(true);
              setMenuPosition(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Metadata</span>
          </button>

          <button
            onClick={handleExportAudio}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Audio File</span>
          </button>

          <div className="h-px bg-border my-1" />

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Track</span>
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
