import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Track, Folder } from '../db/schema';

export function useFolders(scopeType: 'view' | 'playlist' = 'view', scopeId = 'home') {
  const folders = useLiveQuery(async () => {
    return await db.folders
      .where({ scopeType, scopeId })
      .sortBy('order');
  }, [scopeType, scopeId]);

  const createFolder = async (name: string, icon = '📁') => {
    const last = await db.folders.where({ scopeType, scopeId }).last();
    const order = (last?.order ?? -1) + 1;
    return await db.folders.add({
      name,
      icon,
      scopeType,
      scopeId,
      order,
      isCollapsed: false,
    });
  };

  const updateFolder = async (folderId: number, data: Partial<Folder>) => {
    await db.folders.update(folderId, data);
  };

  const toggleFolderCollapse = async (folderId: number, isCollapsed: boolean) => {
    await db.folders.update(folderId, { isCollapsed: !isCollapsed });
  };

  const deleteFolder = async (folderId: number) => {
    await db.folders.delete(folderId);
    await db.trackFolders.where('folderId').equals(folderId).delete();
  };

  const addTracksToFolder = async (folderId: number, trackIds: number[]) => {
    const existing = await db.trackFolders.where('folderId').equals(folderId).sortBy('order');
    const existingTrackIds = new Set(existing.map(e => e.trackId));
    let nextOrder = existing.length > 0 ? existing[existing.length - 1].order + 1 : 0;

    for (const trackId of trackIds) {
      if (!existingTrackIds.has(trackId)) {
        await db.trackFolders.add({
          folderId,
          trackId,
          order: nextOrder++,
        });
      }
    }
  };

  const removeTrackFromFolder = async (folderId: number, trackId: number) => {
    await db.trackFolders.where({ folderId, trackId }).delete();
  };

  return {
    folders: folders || [],
    createFolder,
    updateFolder,
    toggleFolderCollapse,
    deleteFolder,
    addTracksToFolder,
    removeTrackFromFolder,
  };
}

export function useFolderTracks(folderId: number) {
  return useLiveQuery(async () => {
    const mappings = await db.trackFolders
      .where('folderId')
      .equals(folderId)
      .sortBy('order');

    const trackIds = mappings.map(m => m.trackId);
    const tracks = await db.tracks.where('id').anyOf(trackIds).toArray();
    const trackMap = new Map(tracks.map(t => [t.id!, t]));
    return mappings.map(m => trackMap.get(m.trackId)).filter((t): t is Track => !!t);
  }, [folderId]);
}

export function useAllFolderTrackIds() {
  return useLiveQuery(async () => {
    const mappings = await db.trackFolders.toArray();
    return new Set(mappings.map((m) => m.trackId));
  }, []);
}
