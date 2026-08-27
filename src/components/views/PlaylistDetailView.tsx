import React, { useState } from 'react';
import { Disc, Play, Trash2, Edit2, Plus, ArrowLeft } from 'lucide-react';
import { usePlaylistTracks } from '../../hooks/useTracks';
import { usePlaylists } from '../../hooks/usePlaylists';
import { useFolders } from '../../hooks/useFolders';
import { usePlayerStore } from '../../stores/playerStore';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import { FolderSection } from '../library/FolderSection';

interface PlaylistDetailViewProps {
  playlistId: number;
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
  onBack: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  playlistId,
  viewMode = 'grid',
  density = 'comfortable',
  onBack,
}) => {
  const { playlists, updatePlaylist, deletePlaylist } = usePlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  const tracks = usePlaylistTracks(playlistId);
  const { folders, createFolder } = useFolders('playlist', String(playlistId));
  const { playTrack } = usePlayerStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  if (!playlist) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <p>Playlist not found</p>
        <button onClick={onBack} className="mt-4 text-xs text-cyan-400 hover:underline">
          Return to library
        </button>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    await updatePlaylist(playlistId, { name, description });
    setIsEditing(false);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {tracks && tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl glass-card text-xs font-semibold text-zinc-300 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Section</span>
          </button>
        </div>
      </div>

      {/* Playlist Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-cyan-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl shrink-0">
            <Disc className="w-10 h-10" />
          </div>

          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Playlist
            </span>
            {isEditing ? (
              <div className="space-y-2 mt-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-2.5 py-1 bg-zinc-900 border border-purple-500 rounded-xl text-lg font-bold text-zinc-100 focus:outline-none"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="block px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none w-full"
                />
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-zinc-100 truncate">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-xs text-zinc-400 mt-0.5">{playlist.description}</p>
                )}
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {tracks?.length || 0} track{tracks?.length === 1 ? '' : 's'}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => {
                setName(playlist.name);
                setDescription(playlist.description || '');
                setIsEditing(true);
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors"
              title="Edit Playlist"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete playlist "${playlist.name}"?`)) {
                deletePlaylist(playlistId);
                onBack();
              }
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Playlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Folder Form */}
      {isAddingFolder && (
        <form onSubmit={handleCreateFolder} className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name (e.g. Favorites, Acoustic)..."
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-emerald-500/50 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-500 text-zinc-950 rounded-xl text-xs font-bold"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddingFolder(false)}
            className="px-3 py-2 text-zinc-400 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Folders in playlist */}
      {folders.map((folder) => (
        <FolderSection
          key={folder.id}
          folder={folder}
          viewMode={viewMode}
          density={density}
        />
      ))}

      {/* Main Playlist Tracks */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-1">
          Playlist Tracks
        </h3>
        {!tracks || tracks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs glass-panel rounded-2xl border border-zinc-800/60 p-8">
            <Disc className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
            <p className="font-semibold text-zinc-400">This playlist is empty</p>
            <p className="mt-1">Drag tracks here or use the track menu to add songs.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <TrackGrid tracks={tracks} />
        ) : (
          <TrackRowList tracks={tracks} density={density} />
        )}
      </div>
    </div>
  );
};
