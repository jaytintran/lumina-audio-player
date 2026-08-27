import { useLiveQuery } from 'dexie-react-hooks';
import { getAppSettings, updateAppSettings } from '../db/db';
import type { AppSettings } from '../db/schema';

export function useSettings() {
  const data = useLiveQuery(async () => {
    return await getAppSettings();
  }, []);

  return { data };
}

export function useUpdateSettings() {
  return {
    mutate: async (partial: Partial<AppSettings>) => {
      await updateAppSettings(partial);
    },
    mutateAsync: async (partial: Partial<AppSettings>) => {
      await updateAppSettings(partial);
    },
  };
}
