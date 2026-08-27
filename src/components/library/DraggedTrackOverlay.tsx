import React, { useEffect, useState } from 'react';
import { Music, Heart, Layers, Star } from 'lucide-react';
import type { Track } from '../../db/schema';
import { readObjectUrl } from '../../db/opfs';
import { useSettings } from '../../hooks/useSettings';

interface DraggedTrackOverlayProps {
  track: Track;
  viewMode: 'grid' | 'row';
  selectedCount?: number;
}

export const DraggedTrackOverlay: React.FC<DraggedTrackOverlayProps> = ({
  track,
  viewMode,
  selectedCount = 0,
}) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const { data: settings } = useSettings();

  const showArtist = settings?.showArtist ?? true;
  const showAlbum = settings?.showAlbum ?? true;
  const showBitrate = settings?.showBitrate ?? true;
  const showRating = settings?.showRating ?? true;
  const showTags = settings?.showTags ?? true;


  useEffect(() => {
    let active = true;
    if (track.coverKey) {
      readObjectUrl(track.coverKey).then((url) => {
        if (active) setCoverUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [track.coverKey]);

  const isRow = viewMode === 'row';

  return (
    <div className="relative">
      {isRow ? (
        <div className="w-[340px] rounded-lg border-2 border-primary/80 bg-card/85 p-3 shadow-2xl backdrop-blur-md opacity-85 rotate-1 pointer-events-none select-none">
          <div className="flex gap-3 items-center">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-900 shadow-sm flex items-center justify-center">
              {coverUrl ? (
                <img src={coverUrl} alt={track.title} className="h-full w-full object-cover" />
              ) : (
                <Music className="h-6 w-6 text-muted-foreground m-auto" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-sm font-semibold text-foreground">{track.title}</p>
              <p className="truncate text-xs text-muted-foreground flex items-center gap-1.5">
                {showArtist && <span>{track.artist}</span>}
                {showArtist && showAlbum && track.album && <span>·</span>}
                {showAlbum && track.album && <span>{track.album}</span>}
                {showBitrate && (
                  <span className="font-mono uppercase text-[9px] font-semibold px-1 py-0.5 rounded bg-black/40">
                    {track.format}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-52 rounded-lg border-2 border-primary/80 bg-card/80 p-3 shadow-2xl backdrop-blur-md opacity-85 rotate-2 pointer-events-none select-none">
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-neutral-900 shadow-sm flex items-center justify-center">
            {coverUrl ? (
              <img src={coverUrl} alt={track.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            {track.isFavorite && (
              <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/30">
                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              </span>
            )}
            {showRating && (
              <div className="absolute right-2 top-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/70 text-yellow-400 text-[10px] font-mono font-bold">
                <span>{track.rating > 0 ? track.rating : 5}</span>
                <Star className="w-2.5 h-2.5 fill-yellow-400" />
              </div>
            )}
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">{track.title}</p>
          {(showArtist || showAlbum) && (
            <p className="truncate text-xs text-muted-foreground">
              {showArtist && track.artist}
              {showArtist && showAlbum && track.album && ' · '}
              {showAlbum && track.album}
            </p>
          )}
          {showTags && track.tags && track.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {track.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCount > 1 && (
        <div className="absolute -top-3 -right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600 border border-indigo-400 text-white text-xs font-bold shadow-xl animate-bounce">
          <Layers className="w-3.5 h-3.5" />
          <span>{selectedCount} Tracks</span>
        </div>
      )}
    </div>
  );
};

