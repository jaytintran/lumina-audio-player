import React, { useState } from 'react';
import { Tags, Play, ArrowLeft } from 'lucide-react';
import { useGenreGroups } from '../../hooks/useTracks';
import { usePlayerStore } from '../../stores/playerStore';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import type { Track } from '../../db/schema';

interface GenresViewProps {
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
}

export const GenresView: React.FC<GenresViewProps> = ({
  viewMode = 'grid',
  density = 'comfortable',
}) => {
  const genreGroups = useGenreGroups();
  const [selectedGenre, setSelectedGenre] = useState<{ genre: string; tracks: Track[] } | null>(null);
  const { playTrack } = usePlayerStore();

  const genreGradients = [
    'from-cyan-900/60 to-blue-950/80 text-cyan-300 border-cyan-500/30',
    'from-purple-900/60 to-indigo-950/80 text-purple-300 border-purple-500/30',
    'from-emerald-900/60 to-teal-950/80 text-emerald-300 border-emerald-500/30',
    'from-rose-900/60 to-pink-950/80 text-rose-300 border-rose-500/30',
    'from-amber-900/60 to-orange-950/80 text-amber-300 border-amber-500/30',
  ];

  if (selectedGenre) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedGenre(null)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Genres</span>
          </button>

          <button
            onClick={() => playTrack(selectedGenre.tracks[0], selectedGenre.tracks)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Genre</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950/40 to-cyan-950/40 border border-teal-500/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Genre</span>
          <h2 className="text-2xl font-extrabold text-zinc-100">{selectedGenre.genre}</h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            {selectedGenre.tracks.length} track{selectedGenre.tracks.length > 1 ? 's' : ''}
          </p>
        </div>

        {viewMode === 'grid' ? (
          <TrackGrid tracks={selectedGenre.tracks} />
        ) : (
          <TrackRowList tracks={selectedGenre.tracks} density={density} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-teal-400 mb-2">
        <Tags className="w-5 h-5" />
        <h2 className="text-lg font-bold text-zinc-100">Genres</h2>
      </div>

      {!genreGroups || genreGroups.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 text-sm">No genres found in library</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {genreGroups.map((group, idx) => (
            <div
              key={group.genre}
              onClick={() => setSelectedGenre(group)}
              className={`group glass-card p-6 rounded-3xl cursor-pointer border bg-gradient-to-br transition-all ${
                genreGradients[idx % genreGradients.length]
              }`}
            >
              <h3 className="font-extrabold text-lg truncate mb-1">{group.genre}</h3>
              <p className="text-xs text-zinc-400 font-mono">
                {group.trackCount} track{group.trackCount > 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
