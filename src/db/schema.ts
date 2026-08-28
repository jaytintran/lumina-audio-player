export type TrackPlaybackState = "idle" | "playing" | "paused";

export type AudioFormat = "mp3" | "flac" | "wav" | "m4a" | "aac" | "ogg";

export interface Track {
  id?: number;
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  genre?: string;
  duration: number; // in seconds
  bitrate?: number; // kbps
  sampleRate?: number; // Hz
  format: AudioFormat;
  fileKey: string; // OPFS key for audio binary
  fileHash: string; // SHA-256 binary checksum
  coverKey?: string; // OPFS key for extracted album art
  rating: number; // 0 - 5 stars
  isFavorite: boolean;
  playCount: number;
  lastPlayed?: number;
  tags: string[];
  description?: string;
  order: number; // Global library sort order
  dateAdded: number;
}

export interface Playlist {
  id?: number;
  name: string;
  description?: string;
  order: number;
  icon?: string;
  coverKey?: string;
  createdAt: number;
}

export interface Source {
  id?: number;
  title: string;
  url: string;
  order: number;
}

export interface Folder {
  id?: number;
  name: string;
  icon?: string;
  scopeType: "view" | "playlist"; // e.g. "home", "favorites", or playlist ID
  scopeId: string;
  order: number;
  isCollapsed?: boolean;
}

export interface TrackPlaylist {
  id?: number;
  trackId: number;
  playlistId: number;
  order: number;
}

export interface TrackFolder {
  id?: number;
  trackId: number;
  folderId: number;
  order: number;
}

export interface AppSettings {
  id?: number;
  key: string; // "app"
  theme: "dark" | "light";
  viewMode: "grid" | "row";
  tracksPerRow?: number; // 2 - 6
  density: "compact" | "comfortable";
  volume: number; // 0.0 - 1.0
  muted: boolean;
  playbackRate: number; // 0.5x - 2.0x
  crossfade: number; // seconds (0 - 12)
  gaplessPlayback: boolean;
  normalizeAudio: boolean;
  visualizerMode: "bars" | "wave" | "circle";
  // Metadata Visibility Controls:
  showArtist: boolean;
  showAlbum: boolean;
  showDuration: boolean;
  showBitrate: boolean;   // e.g. "FLAC 24-bit" or "320 kbps"
  showRating: boolean;    // 1-5 star rating
  showGenre: boolean;
  showTags: boolean;
  showPlayCount: boolean;
  hideGroupedTracks?: boolean;
}

