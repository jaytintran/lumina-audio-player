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

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed' || pathParts[0] === 'v' || pathParts[0] === 'shorts') {
        if (pathParts[1] && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[1])) return pathParts[1];
      }
    }

    if (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split(/[?#]/)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {}

  // Regex Fallback
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
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

/**
 * Downloads audio stream from a YouTube video into OPFS via configured companion or public Cobalt/Invidious proxy.
 */
export async function downloadYouTubeAudioToOPFS(
  track: Track,
  customEndpoint?: string,
  onProgress?: (msg: string) => void
): Promise<Track> {
  if (!track.youtubeId) {
    throw new Error('Track has no YouTube ID');
  }

  onProgress?.('Resolving audio stream...');

  const videoUrl = `https://www.youtube.com/watch?v=${track.youtubeId}`;
  
  // Array of public extractor endpoints to try
  const endpoints = [
    customEndpoint?.trim(),
    'https://cobalt-api.kwiatekm.pl',
    'https://api.cobalt.tools',
    'https://invidious.nerdvpn.de/api/v1',
    'https://yewtu.be/api/v1',
  ].filter(Boolean) as string[];

  let audioBlob: Blob | null = null;

  for (const endpoint of endpoints) {
    try {
      onProgress?.(`Contacting extractor: ${new URL(endpoint).hostname}...`);
      
      // Try Cobalt API format
      const cobaltRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3',
        }),
      });

      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        const directUrl = cobaltData.url || cobaltData.audio;
        if (directUrl) {
          onProgress?.('Downloading audio stream to OPFS...');
          const streamRes = await fetch(directUrl);
          if (streamRes.ok) {
            audioBlob = await streamRes.blob();
            break;
          }
        }
      }
    } catch (e) {
      console.warn(`Extraction failed on endpoint ${endpoint}:`, e);
    }
  }

  if (!audioBlob) {
    throw new Error(
      'Could not extract audio automatically. You can specify a custom companion endpoint in Settings -> Storage & Privacy.'
    );
  }

  onProgress?.('Saving audio file to local OPFS...');
  const fileKey = `audio/yt_${track.youtubeId}.mp3`;
  await saveFile(fileKey, audioBlob);

  const updatedFields: Partial<Track> = {
    fileKey,
    format: 'mp3',
    source: 'local',
  };

  if (track.id) {
    await db.tracks.update(track.id, updatedFields);
  }

  onProgress?.('Saved for offline playback!');
  return { ...track, ...updatedFields };
}
