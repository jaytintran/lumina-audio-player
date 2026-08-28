import type { Track } from '../db/schema';
import { saveFile } from '../db/opfs';
import { db } from '../db/db';

export interface YouTubeMetadata {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  duration?: number;
}

/**
 * Extracts a standard 11-character YouTube video ID from various URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Plain 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Matching standard youtube.com, youtu.be, music.youtube.com, embeds, shorts
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetches YouTube video metadata (title, author, thumbnail) using the public YouTube oEmbed endpoint.
 */
export async function fetchYouTubeMetadata(youtubeId: string): Promise<YouTubeMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
  
  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube metadata: ${response.statusText}`);
  }

  const data = await response.json();
  const title: string = data.title || 'YouTube Audio';
  const author: string = data.author_name || 'YouTube';
  // High quality thumbnail fallback
  const thumbnailUrl: string =
    data.thumbnail_url || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return {
    id: youtubeId,
    title,
    author,
    thumbnailUrl,
    duration: 0,
  };
}

/**
 * Imports a YouTube video as a library track into IndexedDB, saving thumbnail to OPFS.
 */
export async function importYouTubeTrack(
  urlOrId: string,
  customTitle?: string,
  customArtist?: string
): Promise<Track> {
  const youtubeId = extractYouTubeId(urlOrId);
  if (!youtubeId) {
    throw new Error('Invalid YouTube URL or Video ID');
  }

  // Check if track already exists
  const existing = await db.tracks.where('youtubeId').equals(youtubeId).first();
  if (existing) {
    return existing;
  }

  const meta = await fetchYouTubeMetadata(youtubeId);

  // Attempt to fetch & save thumbnail image to OPFS
  let coverKey: string | undefined = undefined;
  try {
    const imgRes = await fetch(meta.thumbnailUrl);
    if (imgRes.ok) {
      const imgBlob = await imgRes.blob();
      coverKey = `covers/yt_${youtubeId}.jpg`;
      await saveFile(coverKey, imgBlob);
    }
  } catch (err) {
    console.warn('Could not cache YouTube thumbnail to OPFS:', err);
  }

  const title = customTitle?.trim() || meta.title;
  const artist = customArtist?.trim() || meta.author;

  const count = await db.tracks.count();

  const newTrack: Track = {
    title,
    artist,
    album: 'YouTube Stream',
    duration: 0, // YouTube IFrame Player will provide live duration
    format: 'youtube',
    fileKey: `yt_${youtubeId}`,
    fileHash: `yt_${youtubeId}`,
    coverKey,
    rating: 0,
    isFavorite: false,
    playCount: 0,
    tags: ['YouTube', 'Stream'],
    order: count,
    dateAdded: Date.now(),
    source: 'youtube',
    youtubeId,
  };

  const id = await db.tracks.add(newTrack);
  return { ...newTrack, id: id as number };
}
