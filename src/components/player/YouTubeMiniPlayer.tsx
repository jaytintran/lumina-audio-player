import React, { useState } from 'react';
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettings } from '../../hooks/useSettings';
import { downloadYouTubeAudioToOPFS } from '../../services/youtubeService';

interface YouTubeMiniPlayerProps {
  className?: string;
}

export const YouTubeMiniPlayer: React.FC<YouTubeMiniPlayerProps> = ({ className = '' }) => {
  const { currentTrack } = usePlayerStore();
  const { data: settings } = useSettings();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!currentTrack || currentTrack.source !== 'youtube' || !currentTrack.youtubeId) {
    return null;
  }

  const handleDownloadOffline = async () => {
    if (!currentTrack || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      await downloadYouTubeAudioToOPFS(
        currentTrack,
        settings?.youtubeProxyEndpoint,
        (msg) => setDownloadStatus(msg)
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      setDownloadError(err.message || 'Download failed');
    } finally {
      setIsDownloading(false);
      setDownloadStatus(null);
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#090d12] border border-[#17232e] shadow-2xl flex flex-col ${className}`}>
      {/* Video Viewport Container */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          title={currentTrack.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* Offline Download Action Banner */}
      <div className="p-3 bg-[#0d131a] border-t border-[#17232e] flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-200 truncate">{currentTrack.title}</p>
          <p className="text-[11px] text-slate-400 truncate">
            {downloadStatus || 'Streaming online • Download for offline & zero ads'}
          </p>
        </div>

        <button
          onClick={handleDownloadOffline}
          disabled={isDownloading}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
            downloadSuccess
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-white'
          } disabled:opacity-50`}
          title="Download to local OPFS"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved Offline</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Save Offline</span>
            </>
          )}
        </button>
      </div>

      {downloadError && (
        <div className="p-2 bg-rose-950/50 border-t border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-1.5 px-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span className="truncate">{downloadError}</span>
        </div>
      )}
    </div>
  );
};
