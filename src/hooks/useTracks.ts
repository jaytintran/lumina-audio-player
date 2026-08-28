import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Track } from '../db/schema';

export function useAllTracks(searchQuery = '', sortBy: 'order' | 'title' | 'artist' | 'dateAdded' | 'playCount' = 'order', sortDesc = false) {
  return useLiveQuery(async () => {
    let collection = db.tracks.toCollection();

    let tracks = await collection.toArray();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      tracks = tracks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    tracks.sort((a, b) => {
      let valA: any = a[sortBy] ?? '';
      let valB: any = b[sortBy] ?? '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }

      return sortDesc ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
    });

    return tracks;
  }, [searchQuery, sortBy, sortDesc]);
}

export function useFavoriteTracks() {
  return useLiveQuery(async () => {
    return await db.tracks.where('isFavorite').equals(1 as any).toArray();
  }, []);
}

export function useRecentlyPlayedTracks(limit = 30) {
  return useLiveQuery(async () => {
    const tracks = await db.tracks
      .filter(t => !!t.lastPlayed)
      .toArray();
    return tracks.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0)).slice(0, limit);
  }, [limit]);
}

export function useMostPlayedTracks(limit = 30) {
  return useLiveQuery(async () => {
    const tracks = await db.tracks
      .filter(t => (t.playCount || 0) > 0)
      .toArray();
    return tracks.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, limit);
  }, [limit]);
}

export function useLibraryStats() {
  return useLiveQuery(async () => {
    const tracks = await db.tracks.toArray();
    const totalTracks = tracks.length;
    const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const favoritesCount = tracks.filter(t => t.isFavorite).length;

    const uniqueArtists = new Set(tracks.map(t => t.artist.trim())).size;
    const uniqueAlbums = new Set(tracks.filter(t => !!t.album).map(t => t.album!.trim())).size;
    const uniqueGenres = new Set(tracks.filter(t => !!t.genre).map(t => t.genre!.trim())).size;

    return {
      totalTracks,
      totalDuration,
      favoritesCount,
      uniqueArtists,
      uniqueAlbums,
      uniqueGenres,
    };
  }, []);
}

export function useDistinctMetadata() {
  return useLiveQuery(async () => {
    const tracks = await db.tracks.toArray();
    const artistCounts: { [val: string]: number } = {};
    const albumCounts: { [val: string]: number } = {};
    const genreCounts: { [val: string]: number } = {};
    const tagCounts: { [val: string]: number } = {};

    tracks.forEach((t) => {
      const art = t.artist?.trim();
      if (art) artistCounts[art] = (artistCounts[art] || 0) + 1;

      const alb = t.album?.trim();
      if (alb) albumCounts[alb] = (albumCounts[alb] || 0) + 1;

      const gen = t.genre?.trim();
      if (gen) genreCounts[gen] = (genreCounts[gen] || 0) + 1;

      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          const clean = tag.trim();
          if (clean) tagCounts[clean] = (tagCounts[clean] || 0) + 1;
        });
      }
    });

    const toSortedList = (dict: { [k: string]: number }) =>
      Object.entries(dict)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    return {
      artists: toSortedList(artistCounts),
      albums: toSortedList(albumCounts),
      genres: toSortedList(genreCounts),
      tags: toSortedList(tagCounts),
    };
  }, []);
}

export function usePlaylistTracks(playlistId?: number) {
  return useLiveQuery(async () => {
    if (!playlistId) return [];
    const mappings = await db.trackPlaylists
      .where('playlistId')
      .equals(playlistId)
      .sortBy('order');

    const trackIds = mappings.map(m => m.trackId);
    const tracks = await db.tracks.where('id').anyOf(trackIds).toArray();

    // Preserve custom playlist order
    const trackMap = new Map(tracks.map(t => [t.id!, t]));
    return mappings.map(m => trackMap.get(m.trackId)).filter((t): t is Track => !!t);
  }, [playlistId]);
}

export function useArtistGroups() {
  return useLiveQuery(async () => {
    const tracks = await db.tracks.toArray();
    const groups: { [artist: string]: Track[] } = {};
    tracks.forEach(track => {
      const a = track.artist || 'Unknown Artist';
      if (!groups[a]) groups[a] = [];
      groups[a].push(track);
    });
    return Object.entries(groups).map(([artist, list]) => ({
      artist,
      tracks: list,
      trackCount: list.length,
      coverKey: list.find(t => !!t.coverKey)?.coverKey,
    })).sort((a, b) => a.artist.localeCompare(b.artist));
  }, []);
}

export function useAlbumGroups() {
  return useLiveQuery(async () => {
    const tracks = await db.tracks.toArray();
    const groups: { [albumKey: string]: { album: string; artist: string; tracks: Track[]; coverKey?: string; year?: number } } = {};

    tracks.forEach(track => {
      const albumName = track.album || 'Unknown Album';
      const key = `${albumName}___${track.artist}`;
      if (!groups[key]) {
        groups[key] = {
          album: albumName,
          artist: track.artist,
          tracks: [],
          coverKey: track.coverKey,
          year: track.year,
        };
      }
      if (!groups[key].coverKey && track.coverKey) {
        groups[key].coverKey = track.coverKey;
      }
      groups[key].tracks.push(track);
    });

    return Object.values(groups).sort((a, b) => a.album.localeCompare(b.album));
  }, []);
}

export function useGenreGroups() {
  return useLiveQuery(async () => {
    const tracks = await db.tracks.toArray();
    const groups: { [genre: string]: Track[] } = {};

    tracks.forEach(track => {
      const g = track.genre || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(track);
    });

    return Object.entries(groups).map(([genre, list]) => ({
      genre,
      tracks: list,
      trackCount: list.length,
      coverKey: list.find(t => !!t.coverKey)?.coverKey,
    })).sort((a, b) => a.genre.localeCompare(b.genre));
  }, []);
}

export function useTagGroups() {
  return useLiveQuery(async () => {
    const tracks = await db.tracks.toArray();
    const groups: { [tag: string]: Track[] } = {};

    tracks.forEach(track => {
      const tags = track.tags && track.tags.length > 0 ? track.tags : ['Untagged'];
      tags.forEach(tag => {
        const cleanTag = tag.trim();
        if (!cleanTag) return;
        if (!groups[cleanTag]) groups[cleanTag] = [];
        groups[cleanTag].push(track);
      });
    });

    return Object.entries(groups).map(([tag, list]) => ({
      tag,
      tracks: list,
      trackCount: list.length,
      coverKey: list.find(t => !!t.coverKey)?.coverKey,
    })).sort((a, b) => a.tag.localeCompare(b.tag));
  }, []);
}
