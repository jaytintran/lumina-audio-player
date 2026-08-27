import * as mm from 'music-metadata-browser';
import type { AudioFormat } from '../db/schema';

export interface ExtractedMetadata {
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  genre?: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  format: AudioFormat;
  coverBlob?: Blob;
}

export function detectFormat(filename: string, mimeType?: string): AudioFormat {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['flac', 'wav', 'm4a', 'aac', 'ogg', 'mp3'].includes(ext)) {
    return ext as AudioFormat;
  }
  if (mimeType?.includes('audio/flac')) return 'flac';
  if (mimeType?.includes('audio/wav') || mimeType?.includes('audio/x-wav')) return 'wav';
  if (mimeType?.includes('audio/mp4') || mimeType?.includes('audio/m4a') || mimeType?.includes('audio/x-m4a')) return 'm4a';
  if (mimeType?.includes('audio/aac')) return 'aac';
  if (mimeType?.includes('audio/ogg')) return 'ogg';
  return 'mp3';
}

/**
 * Extracts metadata, album artwork, and audio specs from an audio File or Blob
 */
export async function extractAudioMetadata(file: File | Blob, filename: string): Promise<ExtractedMetadata> {
  const format = detectFormat(filename, file.type);
  const baseTitle = filename.replace(/\.[^/.]+$/, '');

  let title = baseTitle;
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let albumArtist: string | undefined = undefined;
  let year: number | undefined = undefined;
  let genre: string | undefined = undefined;
  let duration = 0;
  let bitrate: number | undefined = undefined;
  let sampleRate: number | undefined = undefined;
  let coverBlob: Blob | undefined = undefined;

  try {
    const metadata = await mm.parseBlob(file, { duration: true, skipCovers: false });
    const common = metadata.common;
    const formatMeta = metadata.format;

    if (common.title && common.title.trim()) {
      title = common.title.trim();
    }
    if (common.artist && common.artist.trim()) {
      artist = common.artist.trim();
    }
    if (common.album && common.album.trim()) {
      album = common.album.trim();
    }
    if (common.albumartist && common.albumartist.trim()) {
      albumArtist = common.albumartist.trim();
    }
    if (common.year) {
      year = common.year;
    }
    if (common.genre && common.genre.length > 0) {
      genre = common.genre[0];
    }
    if (formatMeta.duration) {
      duration = Math.round(formatMeta.duration);
    }
    if (formatMeta.bitrate) {
      bitrate = Math.round(formatMeta.bitrate / 1000); // kbps
    }
    if (formatMeta.sampleRate) {
      sampleRate = formatMeta.sampleRate;
    }

    // Extract cover artwork
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      coverBlob = new Blob([pic.data], { type: pic.format || 'image/jpeg' });
    }
  } catch (err) {
    console.warn('music-metadata-browser parse failed, falling back to HTML5 Audio estimation:', err);
    // Fallback HTML5 audio duration estimation
    try {
      duration = await getAudioDurationFallback(file);
    } catch {
      duration = 0;
    }
  }

  return {
    title,
    artist,
    album,
    albumArtist,
    year,
    genre,
    duration,
    bitrate,
    sampleRate,
    format,
    coverBlob,
  };
}

function getAudioDurationFallback(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(blob);
    audio.preload = 'metadata';
    audio.src = url;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration || 0));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}
