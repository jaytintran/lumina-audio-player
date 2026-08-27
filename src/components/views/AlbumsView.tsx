import React, { useState } from 'react';
import { Disc, Play, ArrowLeft } from 'lucide-react';
import { useAlbumGroups } from '../../hooks/useTracks';
import { usePlayerStore } from '../../stores/playerStore';
import { CoverArt } from '../common/CoverArt';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import type { Track } from '../../db/schema';

interface AlbumsViewProps {
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  viewMode = 'grid',
  density = 'comfortable',
}) => {
  const albumGroups = useAlbumGroups();
  const [selectedAlbum, setSelectedAlbum] = useState<{
    album: string;
    artist: string;
    tracks: Track[];
    coverKey?: string;
    year?: number;
  } | null>(null);
  const { playTrack } = usePlayerStore();

  if (selectedAlbum) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Albums</span>
          </button>

          <button
            onClick={() => playTrack(selectedAlbum.tracks[0], selectedAlbum.tracks)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Album</span>
          </button>
        </div>

        <div className="flex items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30">
          <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-emerald-500/40 shrink-0">
            <CoverArt coverKey={selectedAlbum.coverKey} title={selectedAlbum.album} size="full" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Album</span>
            <h2 className="text-2xl font-extrabold text-zinc-100">{selectedAlbum.album}</h2>
            <p className="text-sm text-zinc-300 font-medium">{selectedAlbum.artist}</p>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              {selectedAlbum.tracks.length} track{selectedAlbum.tracks.length > 1 ? 's' : ''}
              {selectedAlbum.year && ` • ${selectedAlbum.year}`}
            </p>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <TrackGrid tracks={selectedAlbum.tracks} />
        ) : (
          <TrackRowList tracks={selectedAlbum.tracks} density={density} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-emerald-400 mb-2">
        <Disc className="w-5 h-5" />
        <h2 className="text-lg font-bold text-zinc-100">Albums</h2>
      </div>

      {!albumGroups || albumGroups.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 text-sm">No albums found in library</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {albumGroups.map((group) => (
            <div
              key={`${group.album}__${group.artist}`}
              onClick={() => setSelectedAlbum(group)}
              className="group glass-card p-3 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition-colors"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-2.5 shadow-lg">
                <CoverArt coverKey={group.coverKey} title={group.album} size="full" />
              </div>
              <h3 className="font-bold text-xs text-zinc-100 truncate group-hover:text-emerald-300">
                {group.album}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">{group.artist}</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">
                {group.tracks.length} tracks
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
