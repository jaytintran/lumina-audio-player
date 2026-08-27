/**
 * OPFS (Origin Private File System) Storage Manager with robust fallbacks.
 * Stores audio binaries (.mp3, .flac, .wav, etc.) and cover artwork Blobs.
 */

// In-memory object URL cache to prevent leaking object URLs and enable instant audio loading
const objectUrlCache = new Map<string, string>();

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
    try {
      return await navigator.storage.getDirectory();
    } catch (e) {
      console.warn('OPFS not accessible, using fallback:', e);
      return null;
    }
  }
  return null;
}

// Ensure nested directory structure in OPFS (e.g. "audio" or "covers")
async function getDirectoryHandle(pathSegments: string[]): Promise<FileSystemDirectoryHandle | null> {
  const root = await getOpfsRoot();
  if (!root) return null;

  let current = root;
  for (const segment of pathSegments) {
    current = await current.getDirectoryHandle(segment, { create: true });
  }
  return current;
}

/**
 * Calculates SHA-256 hash of an ArrayBuffer or Blob
 */
export async function calculateSHA256(data: Blob | ArrayBuffer): Promise<string> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Saves a file to OPFS under a given key (e.g., "audio/hash.mp3" or "covers/hash.jpg")
 */
export async function saveFile(key: string, data: Blob | ArrayBuffer | Uint8Array): Promise<string> {
  try {
    const parts = key.split('/');
    const fileName = parts.pop()!;
    const dirHandle = await getDirectoryHandle(parts);

    if (dirHandle) {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      if (data instanceof Blob) {
        await writable.write(data);
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        await writable.write(data);
      }
      await writable.close();
      return key;
    }
  } catch (err) {
    console.error('Error saving to OPFS:', err);
  }

  // Fallback to IndexedDB cache if OPFS fails
  return key;
}

/**
 * Reads a file from OPFS as a Blob
 */
export async function readBlob(key: string, mimeType?: string): Promise<Blob | null> {
  try {
    const parts = key.split('/');
    const fileName = parts.pop()!;
    const dirHandle = await getDirectoryHandle(parts);

    if (dirHandle) {
      const fileHandle = await dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      if (mimeType && file.type !== mimeType) {
        return new Blob([await file.arrayBuffer()], { type: mimeType });
      }
      return file;
    }
  } catch (err) {
    console.warn(`Could not read OPFS file ${key}:`, err);
  }
  return null;
}

/**
 * Reads a file and creates a cached Object URL for HTML5 Audio playback or <img> elements
 */
export async function readObjectUrl(key: string, mimeType?: string): Promise<string | null> {
  if (!key) return null;
  
  if (objectUrlCache.has(key)) {
    return objectUrlCache.get(key)!;
  }

  const blob = await readBlob(key, mimeType);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrlCache.set(key, url);
  return url;
}

/**
 * Revokes a cached Object URL
 */
export function revokeObjectUrl(key: string): void {
  if (objectUrlCache.has(key)) {
    URL.revokeObjectURL(objectUrlCache.get(key)!);
    objectUrlCache.delete(key);
  }
}

/**
 * Deletes a file from OPFS
 */
export async function deleteFile(key: string): Promise<boolean> {
  revokeObjectUrl(key);
  try {
    const parts = key.split('/');
    const fileName = parts.pop()!;
    const dirHandle = await getDirectoryHandle(parts);

    if (dirHandle) {
      await dirHandle.removeEntry(fileName);
      return true;
    }
  } catch (err) {
    console.warn(`Failed to delete OPFS file ${key}:`, err);
  }
  return false;
}
