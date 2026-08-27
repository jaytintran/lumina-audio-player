import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  ListPlus,
  Play,
  FolderPlus,
  Trash2,
  Heart,
  Disc,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';
import { db } from '../../db/db';
import { deleteFile } from '../../db/opfs';

interface TrackDropdownProps {
  track: Track;
  onDeleted?: () => void;
}

export const TrackDropdown: React.FC<TrackDropdownProps> = ({ track, onDeleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylistsSub, setShowPlaylistsSub] = useState(false);
  const [showFoldersSub, setShowFoldersSub] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { addToQueue, playNext } = usePlayerStore();
  const { playlists, addTracksToPlaylist } = usePlaylists();
  const { folders, addTracksToFolder } = useFolders('view', 'home');

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
    <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 z-50 glass-dropdown rounded-xl py-1.5 shadow-2xl border border-zinc-800 text-xs text-zinc-200">
          <button
            onClick={() => {
              playNext(track);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors text-left"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>Play Next</span>
          </button>

          <button
            onClick={() => {
              addToQueue(track);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-cyan-500/15 hover:text-cyan-300 transition-colors text-left"
          >
            <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add to Queue</span>
          </button>

          <button
            onClick={handleToggleFavorite}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-pink-500/15 hover:text-pink-300 transition-colors text-left"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                track.isFavorite ? 'text-pink-500 fill-pink-500' : 'text-pink-400'
              }`}
            />
            <span>{track.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
          </button>

          <div className="h-px bg-zinc-800 my-1" />

          {/* Add to Playlist Submenu */}
          <div className="relative">
            <button
              onClick={() => setShowPlaylistsSub(!showPlaylistsSub)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                <Disc className="w-3.5 h-3.5 text-purple-400" />
                <span>Add to Playlist</span>
              </span>
              <span className="text-[10px] text-zinc-500">▶</span>
            </button>

            {showPlaylistsSub && (
              <div className="absolute left-full top-0 ml-1 w-44 glass-dropdown rounded-xl py-1 shadow-2xl border border-zinc-800 max-h-48 overflow-y-auto">
                {playlists.length === 0 ? (
                  <div className="px-3 py-2 text-zinc-500 text-[11px]">No playlists yet</div>
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
                      className="w-full text-left px-3 py-1.5 hover:bg-purple-500/20 hover:text-purple-300 truncate"
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
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add to Folder</span>
              </span>
              <span className="text-[10px] text-zinc-500">▶</span>
            </button>

            {showFoldersSub && (
              <div className="absolute left-full top-0 ml-1 w-44 glass-dropdown rounded-xl py-1 shadow-2xl border border-zinc-800 max-h-48 overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="px-3 py-2 text-zinc-500 text-[11px]">No folders yet</div>
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
                      className="w-full text-left px-3 py-1.5 hover:bg-emerald-500/20 hover:text-emerald-300 truncate flex items-center gap-1.5"
                    >
                      <span>{f.icon || '📁'}</span>
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-800 my-1" />

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-500/20 text-rose-400 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Track</span>
          </button>
        </div>
      )}
    </div>
  );
};
