import React, { useState } from 'react';
import { Users, Play, ArrowLeft } from 'lucide-react';
import { useArtistGroups } from '../../hooks/useTracks';
import { usePlayerStore } from '../../stores/playerStore';
import { CoverArt } from '../common/CoverArt';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import type { Track } from '../../db/schema';

interface ArtistsViewProps {
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
}

export const ArtistsView: React.FC<ArtistsViewProps> = ({
  viewMode = 'grid',
  density = 'comfortable',
}) => {
  const artistGroups = useArtistGroups();
  const [selectedArtist, setSelectedArtist] = useState<{ artist: string; tracks: Track[] } | null>(null);
  const { playTrack } = usePlayerStore();

  if (selectedArtist) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedArtist(null)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Artists</span>
          </button>

          <button
            onClick={() => playTrack(selectedArtist.tracks[0], selectedArtist.tracks)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Artist</span>
          </button>
        </div>

        <div className="flex items-center gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 border border-indigo-500/30">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-2xl ring-2 ring-indigo-500/40">
            <CoverArt coverKey={selectedArtist.tracks[0]?.coverKey} title={selectedArtist.artist} size="full" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Artist</span>
            <h2 className="text-2xl font-extrabold text-zinc-100">{selectedArtist.artist}</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {selectedArtist.tracks.length} track{selectedArtist.tracks.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <TrackGrid tracks={selectedArtist.tracks} />
        ) : (
          <TrackRowList tracks={selectedArtist.tracks} density={density} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-indigo-400 mb-2">
        <Users className="w-5 h-5" />
        <h2 className="text-lg font-bold text-zinc-100">Artists</h2>
      </div>

      {!artistGroups || artistGroups.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 text-sm">No artists found in library</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artistGroups.map((group) => (
            <div
              key={group.artist}
              onClick={() => setSelectedArtist(group)}
              className="group glass-card p-4 rounded-3xl text-center cursor-pointer hover:border-indigo-500/40 transition-colors"
            >
              <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden shadow-xl ring-2 ring-indigo-500/20 group-hover:ring-indigo-400/60 transition-colors">
                <CoverArt coverKey={group.coverKey} title={group.artist} size="full" />
              </div>
              <h3 className="font-bold text-sm text-zinc-100 truncate group-hover:text-indigo-300">
                {group.artist}
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {group.trackCount} track{group.trackCount > 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
