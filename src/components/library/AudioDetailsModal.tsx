import React, { useState } from 'react';
import {
  X,
  FileText,
  Edit2,
  Heart,
  Disc,
  FolderPlus,
  Play,
  Pause,
  Layers,
} from 'lucide-react';
import type { Track } from '../../db/schema';
import { usePlayerStore } from '../../stores/playerStore';
import { useMultiDeckStore } from '../../stores/multiDeckStore';
import { CoverArt } from '../common/CoverArt';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { EditTrackMetadataModal } from './EditTrackMetadataModal';
import { AddToSubContextMenu } from '../modals/AddToSubContextMenu';
import { formatDuration } from '../../utils/formatters';
import { db } from '../../db/db';

interface AudioDetailsModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioDetailsModal: React.FC<AudioDetailsModalProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [collectionModalType, setCollectionModalType] = useState<'playlist' | 'folder' | null>(null);

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { addDeck } = useMultiDeckStore();

  if (!isOpen) return null;

  const isCurrent = currentTrack?.id === track.id;

  const handlePlayToggle = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleToggleFavorite = async () => {
    if (!track.id) return;
    await db.tracks.update(track.id, { isFavorite: !track.isFavorite });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="w-full max-w-3xl bg-[#090d13] border border-[#17232e] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#141d27] pb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Audio Details & Notes</h2>
                <p className="text-xs text-slate-400">Detailed track profile and markdown description</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d27] hover:bg-emerald-950/40 hover:text-emerald-300 text-slate-300 border border-[#1e2a38] text-xs font-semibold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Metadata & Notes</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-[#141d27] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body: 2-Column Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-12 gap-6 pr-1">
            {/* Left Column: Artwork + Quick Stats + Action Pill Bar */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="relative group w-full aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden shadow-2xl bg-[#06090d] border border-[#1b2633] flex items-center justify-center">
                <CoverArt coverKey={track.coverKey} title={track.title} size="full" />

                {/* Overlay Play/Pause button */}
                <button
                  onClick={handlePlayToggle}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
                  title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </button>
              </div>

              {/* Title & Artist Block */}
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-base font-extrabold text-slate-100 line-clamp-2" title={track.title}>
                  {track.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium">{track.artist}</p>
                {track.album && (
                  <p className="text-[11px] text-slate-500 truncate">Album: {track.album}</p>
                )}
              </div>

              {/* Metadata Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-[#0e141c] border border-[#182330]">
                  <span className="text-[10px] uppercase text-slate-500 block">Duration</span>
                  <span className="text-slate-200 font-semibold">{formatDuration(track.duration)}</span>
                </div>

                <div className="p-2 rounded-xl bg-[#0e141c] border border-[#182330]">
                  <span className="text-[10px] uppercase text-slate-500 block">Audio Format</span>
                  <span className="text-slate-200 uppercase font-semibold">
                    {track.bitrate ? `${track.bitrate}k ` : ''}{track.format}
                  </span>
                </div>

                {track.genre && (
                  <div className="p-2 rounded-xl bg-[#0e141c] border border-[#182330]">
                    <span className="text-[10px] uppercase text-slate-500 block">Genre</span>
                    <span className="text-emerald-400 font-semibold truncate block">{track.genre}</span>
                  </div>
                )}

                <div className="p-2 rounded-xl bg-[#0e141c] border border-[#182330]">
                  <span className="text-[10px] uppercase text-slate-500 block">Play Count</span>
                  <span className="text-cyan-400 font-semibold">{track.playCount || 0} plays</span>
                </div>
              </div>

              {/* Tags Cloud */}
              {track.tags && track.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Category Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {track.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#141d27]">
                <button
                  onClick={handleToggleFavorite}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    track.isFavorite
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-[#111822] border-[#1e2a38] text-slate-300 hover:bg-[#182230]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{track.isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>

                <button
                  onClick={() => addDeck(track, true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#111822] border border-[#1e2a38] hover:bg-teal-950/40 hover:text-teal-300 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Layer</span>
                </button>

                <button
                  onClick={() => setCollectionModalType('playlist')}
                  className="p-2 rounded-xl bg-[#111822] border border-[#1e2a38] hover:bg-purple-950/40 text-purple-400 hover:border-purple-500/40 transition-colors"
                  title="Add to Playlist"
                >
                  <Disc className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCollectionModalType('folder')}
                  className="p-2 rounded-xl bg-[#111822] border border-[#1e2a38] hover:bg-emerald-950/40 text-emerald-400 hover:border-emerald-500/40 transition-colors"
                  title="Add to Folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Markdown Notes Reader */}
            <div className="md:col-span-7 flex flex-col bg-[#070b10] border border-[#16212e] rounded-2xl p-5 min-h-[320px]">
              <div className="flex items-center justify-between border-b border-[#141d27] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Description & Notes
                  </span>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Edit Notes ✏️
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <MarkdownRenderer content={track.description || ''} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditTrackMetadataModal
          track={track}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {collectionModalType && (
        <AddToSubContextMenu
          type={collectionModalType}
          tracks={[track]}
          onSelect={() => setCollectionModalType(null)}
        />
      )}
    </>
  );
};
