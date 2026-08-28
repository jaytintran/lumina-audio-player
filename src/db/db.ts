import Dexie, { type EntityTable } from 'dexie';
import type { Track, Playlist, Folder, Source, TrackPlaylist, TrackFolder, AppSettings } from './schema';

export class LuminaAudioDatabase extends Dexie {
  tracks!: EntityTable<Track, 'id'>;
  playlists!: EntityTable<Playlist, 'id'>;
  folders!: EntityTable<Folder, 'id'>;
  sources!: EntityTable<Source, 'id'>;
  trackPlaylists!: EntityTable<TrackPlaylist, 'id'>;
  trackFolders!: EntityTable<TrackFolder, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('LuminaAudioDB');

    this.version(1).stores({
      tracks: '++id, title, artist, album, genre, format, fileHash, isFavorite, rating, playCount, lastPlayed, order, dateAdded, *tags',
      playlists: '++id, name, order, createdAt',
      folders: '++id, name, scopeType, scopeId, order',
      sources: '++id, title, url, order',
      trackPlaylists: '++id, trackId, playlistId, order, [playlistId+trackId]',
      trackFolders: '++id, trackId, folderId, order, [folderId+trackId]',
      settings: '++id, key',
    });
  }
}

export const db = new LuminaAudioDatabase();

export const DEFAULT_APP_SETTINGS: AppSettings = {
  key: 'app',
  theme: 'dark',
  viewMode: 'grid',
  tracksPerRow: 4,
  density: 'comfortable',
  volume: 0.85,
  muted: false,
  playbackRate: 1.0,
  crossfade: 0,
  gaplessPlayback: true,
  normalizeAudio: false,
  visualizerMode: 'bars',
  // Metadata Visibility Controls
  showArtist: true,
  showAlbum: true,
  showDuration: true,
  showBitrate: true,
  showRating: true,
  showGenre: true,
  showTags: true,
  showPlayCount: false,
  hideGroupedTracks: false,
};

// Pure read-only query (safe for useLiveQuery context)
export async function getAppSettings(): Promise<AppSettings> {
  const existing = await db.settings.where('key').equals('app').first();
  return existing || DEFAULT_APP_SETTINGS;
}

export async function updateAppSettings(partial: Partial<AppSettings>): Promise<void> {
  const existing = await db.settings.where('key').equals('app').first();
  if (existing?.id) {
    await db.settings.update(existing.id, partial);
  } else {
    await db.settings.add({ ...DEFAULT_APP_SETTINGS, ...partial });
  }
}
