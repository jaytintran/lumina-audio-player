import { db } from '../db/db';
import { saveFile, calculateSHA256 } from '../db/opfs';
import { extractAudioMetadata } from './metadata';
import type { Track } from '../db/schema';

export type DuplicateAction = 'skip' | 'replace' | 'keepBoth';

export interface ImportProgress {
  total: number;
  current: number;
  currentFilename: string;
  status: 'scanning' | 'extracting' | 'saving' | 'done' | 'error';
  errorCount: number;
  duplicatesCount: number;
  importedCount: number;
}

export interface DuplicateConflict {
  file: File;
  existingTrack: Track;
  hash: string;
}

/**
 * Checks if a file is already imported by its SHA-256 hash
 */
export async function findTrackByHash(hash: string): Promise<Track | undefined> {
  return await db.tracks.where('fileHash').equals(hash).first();
}

/**
 * Imports a single audio file with metadata extraction and OPFS persistence
 */
export async function importAudioFile(
  file: File,
  duplicateAction: DuplicateAction = 'skip'
): Promise<{ track?: Track; duplicate?: boolean; error?: string }> {
  try {
    const hash = await calculateSHA256(file);
    const existing = await findTrackByHash(hash);

    if (existing) {
      if (duplicateAction === 'skip') {
        return { duplicate: true, track: existing };
      }
      if (duplicateAction === 'replace') {
        // Update metadata and replace file
        const meta = await extractAudioMetadata(file, file.name);
        const fileKey = `audio/${hash}.${meta.format}`;
        await saveFile(fileKey, file);

        let coverKey = existing.coverKey;
        if (meta.coverBlob) {
          coverKey = `covers/${hash}.jpg`;
          await saveFile(coverKey, meta.coverBlob);
        }

        await db.tracks.update(existing.id!, {
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          albumArtist: meta.albumArtist,
          year: meta.year,
          genre: meta.genre,
          duration: meta.duration,
          bitrate: meta.bitrate,
          sampleRate: meta.sampleRate,
          format: meta.format,
          fileKey,
          coverKey,
        });

        const updated = await db.tracks.get(existing.id!);
        return { track: updated };
      }
      // If keepBoth, proceed with a slightly modified hash or duplicate entry
    }

    const meta = await extractAudioMetadata(file, file.name);
    const fileKey = `audio/${hash}.${meta.format}`;
    await saveFile(fileKey, file);

    let coverKey: string | undefined = undefined;
    if (meta.coverBlob) {
      coverKey = `covers/${hash}.jpg`;
      await saveFile(coverKey, meta.coverBlob);
    }

    const maxOrderTrack = await db.tracks.orderBy('order').last();
    const nextOrder = (maxOrderTrack?.order ?? -1) + 1;

    const newTrack: Track = {
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      albumArtist: meta.albumArtist,
      year: meta.year,
      genre: meta.genre,
      duration: meta.duration,
      bitrate: meta.bitrate,
      sampleRate: meta.sampleRate,
      format: meta.format,
      fileKey,
      fileHash: hash,
      coverKey,
      rating: 0,
      isFavorite: false,
      playCount: 0,
      tags: [],
      order: nextOrder,
      dateAdded: Date.now(),
    };

    const id = await db.tracks.add(newTrack);
    return { track: { ...newTrack, id } };
  } catch (err: any) {
    console.error('Failed to import file:', file.name, err);
    return { error: err.message || 'Unknown import error' };
  }
}

/**
 * Batch import files with progress callback
 */
export async function importAudioBatch(
  files: File[],
  onProgress?: (progress: ImportProgress) => void,
  duplicateAction: DuplicateAction = 'skip'
): Promise<{ imported: Track[]; duplicates: number; errors: number }> {
  const imported: Track[] = [];
  let duplicates = 0;
  let errors = 0;

  const validAudioFiles = files.filter(f => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '') || f.type.startsWith('audio/');
  });

  const total = validAudioFiles.length;

  for (let i = 0; i < total; i++) {
    const file = validAudioFiles[i];
    onProgress?.({
      total,
      current: i + 1,
      currentFilename: file.name,
      status: 'extracting',
      errorCount: errors,
      duplicatesCount: duplicates,
      importedCount: imported.length,
    });

    const res = await importAudioFile(file, duplicateAction);
    if (res.duplicate) {
      duplicates++;
    } else if (res.error) {
      errors++;
    } else if (res.track) {
      imported.push(res.track);
    }
  }

  onProgress?.({
    total,
    current: total,
    currentFilename: '',
    status: 'done',
    errorCount: errors,
    duplicatesCount: duplicates,
    importedCount: imported.length,
  });

  return { imported, duplicates, errors };
}
