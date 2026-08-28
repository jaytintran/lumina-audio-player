import React, { useState } from 'react';
import { Tag, Play, ArrowLeft } from 'lucide-react';
import { useTagGroups } from '../../hooks/useTracks';
import { usePlayerStore } from '../../stores/playerStore';
import { TrackGrid } from '../library/TrackGrid';
import { TrackRowList } from '../library/TrackRow';
import type { Track } from '../../db/schema';

interface TagsViewProps {
  viewMode?: 'grid' | 'row';
  density?: 'compact' | 'comfortable';
}

export const TagsView: React.FC<TagsViewProps> = ({
  viewMode = 'grid',
  density = 'comfortable',
}) => {
  const tagGroups = useTagGroups();
  const [selectedTag, setSelectedTag] = useState<{ tag: string; tracks: Track[] } | null>(null);
  const { playTrack } = usePlayerStore();

  const tagGradients = [
    'from-emerald-950/60 to-teal-950/80 text-emerald-300 border-emerald-500/30',
    'from-indigo-950/60 to-purple-950/80 text-indigo-300 border-indigo-500/30',
    'from-cyan-950/60 to-blue-950/80 text-cyan-300 border-cyan-500/30',
    'from-amber-950/60 to-orange-950/80 text-amber-300 border-amber-500/30',
    'from-rose-950/60 to-pink-950/80 text-rose-300 border-rose-500/30',
  ];

  if (selectedTag) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedTag(null)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tags</span>
          </button>

          <button
            onClick={() => playTrack(selectedTag.tracks[0], selectedTag.tracks)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-400 text-slate-950 font-bold text-xs hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Tag</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-[#090d13] border border-[#17232e] shadow-xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Tag className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Category Tag</span>
            <h2 className="text-2xl font-extrabold text-slate-100 mt-0.5">#{selectedTag.tag}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {selectedTag.tracks.length} track{selectedTag.tracks.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <TrackGrid tracks={selectedTag.tracks} />
        ) : (
          <TrackRowList tracks={selectedTag.tracks} density={density} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-400" />
          <span>Tags</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Browse tracks by custom mood, activity, or category tags</p>
      </div>

      {!tagGroups || tagGroups.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-400" />
          <p>No tags assigned yet</p>
          <p className="text-xs text-slate-600 mt-1">Edit track metadata to add tags like #chill, #focus, or #workout</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {tagGroups.map((tg, idx) => {
            const gradient = tagGradients[idx % tagGradients.length];
            return (
              <div
                key={tg.tag}
                onClick={() => setSelectedTag(tg)}
                className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} border shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between min-h-[110px] group`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform">
                    <Tag className="w-4 h-4 text-emerald-400" />
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-300">
                    {tg.trackCount}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                    #{tg.tag}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tg.trackCount} track{tg.trackCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
