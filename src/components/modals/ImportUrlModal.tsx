import React, { useState } from 'react';
import { X, Video, Link as LinkIcon, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { extractYouTubeId, fetchYouTubeMetadata, importYouTubeTrack, type YouTubeMetadata } from '../../services/youtubeService';
import type { Track } from '../../db/schema';

interface ImportUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackImported?: (track: Track) => void;
}

export const ImportUrlModal: React.FC<ImportUrlModalProps> = ({
  isOpen,
  onClose,
  onTrackImported,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<YouTubeMetadata | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleFetchPreview = async () => {
    setError(null);
    const id = extractYouTubeId(url);
    if (!id) {
      setError('Please enter a valid YouTube video link or ID');
      return;
    }

    setIsLoading(true);
    try {
      const meta = await fetchYouTubeMetadata(id);
      setPreview(meta);
      setCustomTitle(meta.title);
      setCustomArtist(meta.author);
    } catch (err: any) {
      setError(err.message || 'Could not fetch video details from YouTube.');
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setIsImporting(true);

    try {
      const track = await importYouTubeTrack(url, customTitle, customArtist);
      setSuccessToast(true);
      onTrackImported?.(track);
      setTimeout(() => {
        setSuccessToast(false);
        setUrl('');
        setPreview(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to import YouTube track.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#090d12] rounded-3xl p-6 shadow-2xl border border-[#17232e] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#17232e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Import YouTube Audio</h2>
              <p className="text-xs text-slate-400">Add songs or podcasts directly from YouTube links</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleImport} className="py-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              YouTube Video URL or ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (preview) setPreview(null);
                    if (error) setError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e141c] border border-[#1a2636] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500/60"
                />
              </div>

              <button
                type="button"
                onClick={handleFetchPreview}
                disabled={isLoading || !url.trim()}
                className="px-3 py-2 rounded-xl bg-[#141d27] border border-[#1e2a38] text-slate-200 hover:bg-[#1a2634] hover:text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                )}
                <span>Fetch</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Video Metadata Preview */}
          {preview && (
            <div className="p-3.5 rounded-2xl bg-[#0d131a] border border-[#17232e] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex gap-3 items-center">
                <img
                  src={preview.thumbnailUrl}
                  alt={preview.title}
                  className="w-20 h-14 rounded-lg object-cover border border-[#1c2836] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate text-xs">{preview.title}</p>
                  <p className="text-slate-400 truncate text-[11px] mt-0.5">{preview.author}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono text-red-400 bg-red-950/40 px-1.5 py-0.2 rounded border border-red-500/30">
                    YouTube Online Stream
                  </span>
                </div>
              </div>

              {/* Editable metadata fields */}
              <div className="space-y-2 pt-2 border-t border-[#17232e]">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Track Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#070a0e] border border-[#1a2636] text-xs text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Artist / Channel</label>
                  <input
                    type="text"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#070a0e] border border-[#1a2636] text-xs text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {successToast && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Track added to library successfully!</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#17232e]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isImporting || !url.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Add to Library</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
