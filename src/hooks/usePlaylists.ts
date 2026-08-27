import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Playlist } from '../db/schema';

export function usePlaylists() {
  const playlists = useLiveQuery(async () => {
    return await db.playlists.orderBy('order').toArray();
  }, []);

  const createPlaylist = async (name: string, description?: string, icon?: string) => {
    const last = await db.playlists.orderBy('order').last();
    const order = (last?.order ?? -1) + 1;
    const id = await db.playlists.add({
      name,
      description,
      icon,
      order,
      createdAt: Date.now(),
    });
    return id;
  };

  const updatePlaylist = async (id: number, partial: Partial<Playlist>) => {
    await db.playlists.update(id, partial);
  };

  const deletePlaylist = async (id: number) => {
    await db.playlists.delete(id);
    await db.trackPlaylists.where('playlistId').equals(id).delete();
  };

  const addTracksToPlaylist = async (playlistId: number, trackIds: number[]) => {
    const existing = await db.trackPlaylists.where('playlistId').equals(playlistId).sortBy('order');
    const existingTrackIds = new Set(existing.map(e => e.trackId));
    let nextOrder = existing.length > 0 ? existing[existing.length - 1].order + 1 : 0;

    for (const trackId of trackIds) {
      if (!existingTrackIds.has(trackId)) {
        await db.trackPlaylists.add({
          playlistId,
          trackId,
          order: nextOrder++,
        });
      }
    }
  };

  const removeTrackFromPlaylist = async (playlistId: number, trackId: number) => {
    await db.trackPlaylists.where({ playlistId, trackId }).delete();
  };

  const reorderPlaylists = async (playlistIds: number[]) => {
    for (let i = 0; i < playlistIds.length; i++) {
      await db.playlists.update(playlistIds[i], { order: i });
    }
  };

  return {
    playlists: playlists || [],
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylists,
  };
}
