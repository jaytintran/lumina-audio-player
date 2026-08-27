/**
 * Formats seconds to mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats total duration for stats (e.g. "1 hr 24 mins" or "45 mins")
 */
export function formatTotalDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0 min';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Formats file size in bytes to MB/KB
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Returns audio badge info based on format and bitrate
 */
export function getAudioQualityBadge(format: string, bitrate?: number, sampleRate?: number): {
  label: string;
  isLossless: boolean;
  color: string;
} {
  const f = format.toLowerCase();
  if (f === 'flac' || f === 'wav') {
    const sr = sampleRate ? `${(sampleRate / 1000).toFixed(1)}kHz` : 'Lossless';
    return {
      label: `${f.toUpperCase()} • ${sr}`,
      isLossless: true,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    };
  }

  if (bitrate && bitrate >= 320) {
    return {
      label: `${f.toUpperCase()} 320k`,
      isLossless: false,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    };
  }

  return {
    label: bitrate ? `${f.toUpperCase()} ${bitrate}k` : f.toUpperCase(),
    isLossless: false,
    color: 'text-zinc-400 border-zinc-700/50 bg-zinc-800/40',
  };
}
