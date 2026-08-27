import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Source } from '../db/schema';

export function useSources() {
  // Initialize default sources once if DB is empty
  useEffect(() => {
    async function initDefaultSources() {
      const count = await db.sources.count();
      if (count === 0) {
        const defaultSources: Omit<Source, 'id'>[] = [
          { title: 'Free Music Archive', url: 'https://freemusicarchive.org', order: 0 },
          { title: 'Incompetech Royalty-Free', url: 'https://incompetech.com', order: 1 },
        ];
        for (const s of defaultSources) {
          await db.sources.add(s);
        }
      }
    }
    initDefaultSources();
  }, []);

  const sources = useLiveQuery(async () => {
    return await db.sources.orderBy('order').toArray();
  }, []);

  const addSource = async (title: string, url: string) => {
    const last = await db.sources.orderBy('order').last();
    const order = (last?.order ?? -1) + 1;
    return await db.sources.add({
      title: title.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      order,
    });
  };

  const deleteSource = async (id: number) => {
    await db.sources.delete(id);
  };

  return {
    sources: sources || [],
    addSource,
    deleteSource,
  };
}
