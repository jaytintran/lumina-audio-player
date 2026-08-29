import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Sparkles, Star, Check, Heart, Plus, Link as LinkIcon } from 'lucide-react';
import type { Track } from '../../db/schema';
import { db } from '../../db/db';
import { saveFile, calculateSHA256 } from '../../db/opfs';
import { CoverArt } from '../common/CoverArt';
import { generateRandomCoverBlob } from '../../utils/coverGenerator';
import { useDistinctMetadata } from '../../hooks/useTracks';
import { AutoSuggestInput } from '../common/AutoSuggestInput';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface EditTrackMetadataModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: Track) => void;
}

export const EditTrackMetadataModal: React.FC<EditTrackMetadataModalProps> = ({
  track,
  isOpen,
  onClose,
  onSaved,
}) => {
  const metaStats = useDistinctMetadata();
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album || '');
  const [albumArtist, setAlbumArtist] = useState(track.albumArtist || '');
  const [year, setYear] = useState<number | undefined>(track.year);
  const [genre, setGenre] = useState(track.genre || '');
  const [rating, setRating] = useState(track.rating || 0);
  const [tags, setTags] = useState<string[]>(track.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState(track.description || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(track.isFavorite || false);
  const [coverKey, setCoverKey] = useState(track.coverKey);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when incoming track changes
  useEffect(() => {
    setTitle(track.title);
    setArtist(track.artist);
    setAlbum(track.album || '');
    setAlbumArtist(track.albumArtist || '');
    setYear(track.year);
    setGenre(track.genre || '');
    setRating(track.rating || 0);
    setTags(track.tags || []);
    setDescription(track.description || '');
    setIsFavorite(track.isFavorite || false);
    setCoverKey(track.coverKey);
    setImageUrlInput('');
    setImageUrlError(null);
  }, [track]);

  // Handle Ctrl+Enter shortcut to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, artist, album, albumArtist, year, genre, rating, tags, description, isFavorite, coverKey]);

  if (!isOpen) return null;

  const handleArtworkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsProcessingCover(true);
        const hash = await calculateSHA256(file);
        const newKey = `covers/${hash}.jpg`;
        await saveFile(newKey, file);
        setCoverKey(newKey);
      } catch (err) {
        console.error('Failed to update cover artwork:', err);
      } finally {
        setIsProcessingCover(false);
      }
    }
  };

  const handleImportImageUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url) return;

    try {
      setIsProcessingCover(true);
      setImageUrlError(null);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      const hash = await calculateSHA256(blob);
      const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const newKey = `covers/${hash}.${ext}`;
      await saveFile(newKey, blob);
      setCoverKey(newKey);
      setImageUrlInput('');
    } catch (err: any) {
      console.error('Failed to import cover from URL:', err);
      setImageUrlError(err.message || 'Failed to download image. Note: CORS restrictions on some hosts may prevent direct loading.');
    } finally {
      setIsProcessingCover(false);
    }
  };

  const handleGenerateRandomCover = async () => {
    try {
      setIsProcessingCover(true);
      const blob = await generateRandomCoverBlob(title.trim() || 'Audio Track', artist.trim() || 'Artist');
      const hash = await calculateSHA256(blob);
      const newKey = `covers/${hash}.jpg`;
      await saveFile(newKey, blob);
      setCoverKey(newKey);
    } catch (err) {
      console.error('Failed to generate abstract cover:', err);
    } finally {
      setIsProcessingCover(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^,|,$/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!track.id) return;

    try {
      setIsSaving(true);
      const updatedData: Partial<Track> = {
        title: title.trim() || track.title,
        artist: artist.trim() || track.artist,
        album: album.trim() || undefined,
        albumArtist: albumArtist.trim() || undefined,
        year: year ? Number(year) : undefined,
        genre: genre.trim() || undefined,
        rating,
        tags,
        description: description.trim() || undefined,
        isFavorite,
        coverKey,
      };

      await db.tracks.update(track.id, updatedData);
      const refreshed = await db.tracks.get(track.id);
      if (refreshed && onSaved) {
        onSaved(refreshed);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save track metadata:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const ratingLabel = rating === 0 ? 'Unrated' : `${rating}.0`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0f141a] rounded-2xl p-6 shadow-2xl border border-[#1e2936] flex flex-col max-h-[92vh] overflow-hidden text-slate-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-base font-semibold text-slate-100">Edit Metadata</h2>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Body - 2 Stacked Sections */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-2 space-y-5 pr-1">
          {/* Section 1: Cover Artwork & Artwork Actions */}
          <div className="p-3.5 rounded-xl bg-[#121820]/60 border border-[#1e2936] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Cover Preview */}
            <div className="relative group w-28 h-28 shrink-0 rounded-xl overflow-hidden shadow-lg bg-[#0a0d12] flex items-center justify-center border border-[#223040]">
              <CoverArt coverKey={coverKey} title={title} size="full" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleArtworkUpload}
              className="hidden"
            />

            {/* Artwork Controls */}
            <div className="flex-1 w-full flex flex-col gap-2">
              {/* Row 1: Direct URL Input Bar with Link icon and Import button */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c1017] border border-[#223040] focus-within:border-emerald-500/70 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                  <div className="pl-2 pr-1 text-slate-500 flex items-center justify-center">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="url"
                    placeholder="Paste image link & press enter..."
                    value={imageUrlInput}
                    onChange={(e) => {
                      setImageUrlInput(e.target.value);
                      setImageUrlError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleImportImageUrl();
                      }
                    }}
                    disabled={isProcessingCover}
                    className="flex-1 min-w-0 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleImportImageUrl}
                    disabled={isProcessingCover || !imageUrlInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs disabled:opacity-40 disabled:hover:bg-emerald-500 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                  >
                    {isProcessingCover && imageUrlInput.trim() ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 animate-spin" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span>Import</span>
                    )}
                  </button>
                </div>
                {imageUrlError && (
                  <span className="text-[10px] text-rose-400 leading-tight px-1 break-words">{imageUrlError}</span>
                )}
              </div>

              {/* Row 2: Secondary Quick Actions Side-by-Side */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingCover}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#141b24] border border-[#263546] text-slate-200 hover:bg-[#1a2330] hover:text-white hover:border-slate-500/40 text-xs font-medium transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateRandomCover}
                  disabled={isProcessingCover}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#10241b] border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-950/40 text-xs font-medium transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isProcessingCover && !imageUrlInput.trim() ? 'animate-spin' : ''}`} />
                  <span>{isProcessingCover && !imageUrlInput.trim() ? 'Generating...' : 'Generate Abstract'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Metadata Fields */}
          <div className="space-y-3.5">
            {/* Title */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#141b24] border border-[#223040] text-xs text-slate-100 focus:outline-none focus:border-emerald-500/80 transition-colors"
              />
            </div>

            {/* Artist & Album in 2 Columns with Auto-Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AutoSuggestInput
                label="Artist"
                required
                value={artist}
                onChange={setArtist}
                suggestions={metaStats?.artists || []}
                placeholder="Artist name"
              />

              <AutoSuggestInput
                label="Album"
                value={album}
                onChange={setAlbum}
                suggestions={metaStats?.albums || []}
                placeholder="Album name"
              />
            </div>

            {/* Year & Genre in 2 Columns with Auto-Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={year || ''}
                  onChange={(e) => setYear(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141b24] border border-[#223040] text-xs text-slate-100 focus:outline-none focus:border-emerald-500/80 transition-colors font-mono"
                />
              </div>

              <AutoSuggestInput
                label="Genre"
                value={genre}
                onChange={setGenre}
                suggestions={metaStats?.genres || []}
                placeholder="e.g. Ambient, Synthwave"
              />
            </div>

            {/* Rating Section (stars + unrated/score label matching screenshot) */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">Rating</label>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      className="p-0.5 rounded transition-transform hover:scale-115 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-600 hover:text-yellow-400/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 ml-1.5">{ratingLabel}</span>
              </div>
            </div>

            {/* Tags (comma separated) + Existing Tag Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-400">Category Tags (press Enter or comma)</label>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[#141b24] border border-[#223040] min-h-[38px] focus-within:border-emerald-500/80 transition-colors">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? 'e.g. ambient, relax, workout' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-200 focus:outline-none placeholder-slate-500"
                />
              </div>

              {/* Tag Quick-Pick Suggestions Cloud */}
              {metaStats?.tags && metaStats.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium">Suggestions:</span>
                  {metaStats.tags
                    .filter((t) => !tags.includes(t.value))
                    .slice(0, 6)
                    .map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTags((prev) => [...prev, t.value])}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111822] hover:bg-emerald-950/40 text-[10px] text-slate-400 hover:text-emerald-300 border border-[#1d2938] hover:border-emerald-500/40 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>#{t.value}</span>
                        <span className="text-[9px] text-slate-600 font-mono">({t.count})</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Description / Notes (Markdown) Editor Section */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] text-slate-400">
                  Description / Notes <span className="text-slate-500">(Markdown Supported)</span>
                </label>
                <div className="flex items-center gap-1 bg-[#101720] border border-[#1f2c3d] p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(false)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      !isPreviewMode ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(true)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      isPreviewMode ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {!isPreviewMode ? (
                <div className="space-y-1">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write detailed notes, prompts, affirmations, track story, or timestamps (e.g. 01:23 - drop)..."
                    className="w-full px-3 py-2 rounded-lg bg-[#141b24] border border-[#223040] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors custom-scrollbar font-sans"
                  />
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                    <span>Quick Format:</span>
                    <button
                      type="button"
                      onClick={() => setDescription((prev) => `${prev} **bold**`)}
                      className="px-1.5 py-0.5 rounded bg-[#101720] border border-[#1f2c3d] text-slate-400 hover:text-emerald-300"
                    >
                      **bold**
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescription((prev) => `${prev}\n- list item`)}
                      className="px-1.5 py-0.5 rounded bg-[#101720] border border-[#1f2c3d] text-slate-400 hover:text-emerald-300"
                    >
                      - list
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescription((prev) => `${prev}\n- [ ] task`)}
                      className="px-1.5 py-0.5 rounded bg-[#101720] border border-[#1f2c3d] text-slate-400 hover:text-emerald-300"
                    >
                      [ ] task
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescription((prev) => `${prev}\n00:00 - start`)}
                      className="px-1.5 py-0.5 rounded bg-[#101720] border border-[#1f2c3d] text-slate-400 hover:text-emerald-300"
                    >
                      00:00 timestamp
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#0e141c] border border-[#223040] min-h-[100px] max-h-48 overflow-y-auto custom-scrollbar">
                  <MarkdownRenderer content={description} />
                </div>
              )}
            </div>

            {/* Favorite Checkbox */}
            <div className="pt-1 flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#141b24] border-[#223040] text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                  <span>Favorite</span>
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions matching screenshot */}
        <div className="flex items-center justify-end gap-2.5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#141b24] border border-[#263546] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1a2330] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22c55e] text-slate-950 font-semibold text-xs hover:bg-[#16a34a] transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
          >
            {isSaving && <Check className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
